"""Checks for js/data/topic-db-sql.js and its packs (db-sql-p2.js, db-sql-p3.js). Ids Tdb-sql-NN.
SQL runs in Python's sqlite3; ORM code runs with Flask 3.1.3, Flask-SQLAlchemy 3.1.1 and SQLAlchemy 2.1.9 on an
in-memory SQLite database with an app context pushed (spec convention 6). Option code is read from the built packs."""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from assertlib import check, run_py, eq, main  # noqa: E402
from bank_code_q2 import CODE  # noqa: E402

# One run: build the models, then run each command in order. Output is stdout, and the first error ends the run
# with a line "EXC <Type>: <first line of the message>". An error while defining the models gives "MODEL EXC ...".
ORM = r'''
import io, contextlib, sys, warnings
warnings.simplefilter("ignore")
from datetime import date, timedelta
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, and_
app = Flask(__name__); app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite://"
db = SQLAlchemy(app); app.app_context().push()
ns = {"db": db, "func": func, "and_": and_, "date": date, "timedelta": timedelta}
try:
    exec(MODELS, ns); db.create_all()
except Exception as e:
    print("MODEL EXC %s: %s" % (type(e).__name__, str(e).splitlines()[0])); sys.exit(0)
try:
    for c in CMDS:
        try:
            code = compile(c, "<shell>", "eval")
        except SyntaxError:
            exec(c, ns); continue
        v = eval(code, ns)
        if v is not None:
            print(repr(v))
except Exception as e:
    print("EXC %s: %s" % (type(e).__name__, str(e).splitlines()[0]))
'''


def orm(models, cmds):
    o, e, rc = run_py("MODELS = %r\nCMDS = %r\n" % (models, list(cmds)) + ORM)
    if rc:
        raise AssertionError(e[-600:])
    return o.strip()


def sql(setup, query):
    o, e, rc = run_py("import sqlite3, json\nc = sqlite3.connect(':memory:')\nc.executescript(%r)\nprint(json.dumps(c.execute(%r).fetchall()))\n" % (setup, query))
    if rc:
        raise AssertionError(e[-400:])
    return [tuple(r) for r in json.loads(o)]


def shell(src):
    """A `>>>` / `...` transcript as plain code (prompts and bare continuation lines removed)."""
    out = []
    for line in src.splitlines():
        if line.startswith((">>> ", "... ")):
            out.append(line[4:])
        elif line.strip() in ("...", ">>>"):
            out.append("")
        else:
            out.append(line)
    return "\n".join(out)


_PACKS = None


def options(qid):
    global _PACKS
    if _PACKS is None:
        _PACKS = json.loads(subprocess.run(["node", os.path.join(HERE, "dump_data.js")], capture_output=True, text=True, check=True).stdout)["packs"]["q2"]["db-sql"]["pyqs"]
    q = next(q for q in _PACKS if q["id"] == qid)
    return [re.search(r"```[\w]*\n(.*?)\n\s*```", o, re.S).group(1) if "```" in o else o.strip("`") for o in q["options"]]


# ================= SQL
PROD = ("create table production(Manufacturer, Product, Quantity, Cost);"
        "insert into production values('Industry A','Biscuits',3,100),('Industry B','Shoes',2,500),('Industry A','Chocolate',10,200),"
        "('Industry C','Pen',20,50),('Industry B','Shirts',5,700),('Industry D','Beverages',30,150),('Industry C','Notebook',40,250);")
TA = ("create table table_A(ID, First_Name, Last_Name, Course);"
      "insert into table_A values(1,'Raj','R','Java'),(2,'Riya','Z','Java'),(3,'Sam','sundar','Java'),(4,'praneeth','k','Java'),"
      "(5,'Kunal','T','Python'),(6,'vimal','singh','Python'),(7,'sethu','J','Python'),(8,'liza','G','C++'),(9,'shylla','chopra','C++');")
FL = ("create table flowers(ID, Name, color);"
      "insert into flowers values(1,'Jasmine','white'),(2,'Rose','pink'),(3,'Lily','pink'),(4,'Lotus','pink'),(5,'Red rose','red');")


@check("Tdb-sql-01")
def pyq_640653351988():
    eq(sql(PROD, CODE["640653351988"][0]), [("Industry C", 2)], "WHERE first, then groups, then HAVING")
    eq(sql(PROD, "SELECT Manufacturer, COUNT(*) FROM production WHERE Quantity>10 GROUP BY Manufacturer"), [("Industry C", 2), ("Industry D", 1)], "groups before HAVING")


@check("Tdb-sql-02")
def pyq_640653351996():
    eq(sql(TA, CODE["640653351996"][0]), [("C++", 2), ("Python", 3), ("Java", 4)], "one row per course, ascending count")


@check("Tdb-sql-03")
def pyq_640653351995():
    eq(sql(FL, CODE["640653351995"][0]), [(1, "Red rose", "red"), (1, "Jasmine", "white")], "groups of size 1, sorted by color, names as stored")
    eq(sql(FL, "select count(ID), Name, color from flowers group by color"), [(3, "Rose", "pink"), (1, "Red rose", "red"), (1, "Jasmine", "white")], "bare Name rides along")


@check("Tdb-sql-04")
def where_vs_having():
    eq(sql(PROD, "SELECT Manufacturer, SUM(Quantity) FROM production GROUP BY Manufacturer HAVING SUM(Quantity) > 20 ORDER BY 2 DESC"), [("Industry C", 60), ("Industry D", 30)], "HAVING filters groups")
    o, e, rc = run_py("import sqlite3\nc=sqlite3.connect(':memory:')\nc.executescript(%r)\nc.execute('SELECT Manufacturer FROM production WHERE COUNT(*) > 1 GROUP BY Manufacturer')\n" % PROD)
    eq("misuse of aggregate" in e, True, "an aggregate in WHERE is an error")


@check("Tdb-sql-05")
def count_col_skips_null():
    eq(sql("create table t(a); insert into t values(1),(NULL),(3);", "select count(*), count(a) from t"), [(3, 2)], "COUNT(col) skips NULL")


# ================= models and relationships
@check("Tdb-sql-06")
def pyq_640653351992():
    o = orm(options("640653351992")[1].replace("Base = declarative_base()", "from sqlalchemy.orm import declarative_base\nfrom sqlalchemy import Column, Integer, String\nBase = declarative_base()"),
            ["print(Items.__table__.name, [(c.name, c.primary_key) for c in Items.__table__.columns])"])
    eq(o, "Items [('ID', True), ('name', False), ('cost', False)]", "option B mirrors the table")


@check("Tdb-sql-07")
def pyq_640653586811():
    base = CODE["640653586811"][0]
    got = []
    for o in options("640653586811"):
        c1, c2 = [ln.split(":", 1)[1].strip() for ln in o.splitlines() if ln.strip()]
        m = base.replace("# write your code 1 here", c1).replace("# write your code 2 here", c2)
        r = orm(m + "\nfrom sqlalchemy.orm import configure_mappers\n", ["configure_mappers()", "print({k: [(r.key, r.direction.name) for r in v.__mapper__.relationships] for k, v in (('Parent', Parent), ('Child', Child))})"])
        got.append(r)
    eq(got[1], "{'Parent': [('children', 'ONETOMANY')], 'Child': []}", "B: a parent has many children")
    eq(got[0], "{'Parent': [], 'Child': [('children', 'ONETOMANY')]}", "A: the reverse (a child has many parents)")
    eq([g.split(":")[0] for g in got[2:]], ["EXC NoForeignKeysError"] * 2, "C, D: relationship and key in the wrong classes")


BC = CODE["640653586799"][0]


@check("Tdb-sql-08")
def pyq_640653586799():
    o, e, rc = run_py("from flask_sqlalchemy import SQLAlchemy\ndb = SQLAlchemy()\n" + BC)
    eq("positional argument follows keyword argument" in e, True, "as written: SyntaxError")
    fixed = BC.replace('db.Column (db.Integer(), unique = True, db.ForeignKey("brand.id"))', 'db.Column (db.Integer(), db.ForeignKey("brand.id"), unique = True)')
    r = orm(fixed, ['b = Brand(name="x")', "db.session.add(b)", "db.session.commit()", 'db.session.add(Cellphone(name="p1", brand=b.id))', "db.session.commit()",
                    'db.session.add(Cellphone(name="p2", brand=b.id))', "db.session.commit()"])
    eq(r, "EXC IntegrityError: (sqlite3.IntegrityError) UNIQUE constraint failed: cellphone.brand", "a unique foreign key allows one phone per brand")


@check("Tdb-sql-09")
def pyq_640653856978():
    r = orm(CODE["640653856978"][0], ['db.session.add_all([Product(id=1, name="p1"), Product(id=2, name="p2"), Supplier(id=1, name="s1"), Supplier(id=2, name="s2")])',
                                      "db.session.add_all([Supply(product_id=1, supplier_id=1), Supply(product_id=1, supplier_id=2), Supply(product_id=2, supplier_id=1)])",
                                      "db.session.commit()", "print(Supply.query.filter_by(product_id=1).count(), Supply.query.filter_by(supplier_id=1).count())"])
    eq(r, "2 2", "one product, two suppliers; one supplier, two products")


@check("Tdb-sql-10")
def pyq_640653856979():
    got = [orm(o, []) for o in options("640653856979")]
    eq(got, ["MODEL EXC AttributeError: model"] * 4, "as written every option uses db.model")
    fixed = [o.replace("db.model", "db.Model").replace("db.Foreignkey", "db.ForeignKey") for o in options("640653856979")]
    use = ['s = Student(Name="a")', "db.session.add(s)", "db.session.commit()", 'sp = Sport(sport_name="x", stud_id=s.id)', "db.session.add(sp)", "db.session.commit()", "print(s.sports, sp.student)"]
    r = [orm(f, use).split(":")[0] for f in fixed]
    eq(r, ["EXC TypeError", "EXC NoForeignKeysError", "MODEL EXC ArgumentError", "[<Sport 1>] <Student 1>"], "with db.Model only D works")


@check("Tdb-sql-11")
def pyq_6406531021284():
    use = ['s = Student(name="a")', "db.session.add(s)", "db.session.commit()", "print(hasattr(Student, 'assignments'), [f.target_fullname for f in Assignment.__table__.foreign_keys])"]
    r = [orm(o, use) for o in options("6406531021284")]
    eq(r[0], "False []", "A: no foreign key, no relationship")
    eq(r[1].split(":")[0], "EXC NoForeignKeysError", "B: a bare ForeignKey is not a column")
    eq(r[2], "True ['student.id']", "C works")
    eq(r[3].split(":")[0], "MODEL EXC NoReferencedTableError", "D: table names are lower case")


@check("Tdb-sql-12")
def pyq_6406532180398():
    r = orm(CODE["6406532180398"][0], ['db.session.add(Course(id=1, title="t"))', 'db.session.add_all([Enrollment(student_id="s1", course_id=1), Enrollment(student_id="s2", course_id=1)])', "db.session.commit()", "print(Enrollment.query.filter_by(course_id=1).count())"])
    eq(r, "2", "many enrollments for one course")


@check("Tdb-sql-13")
def pyq_640653771136():
    r = [orm(o, ["print([(c.name, c.primary_key, c.nullable) for c in Employee.__table__.columns])"]) for o in options("640653771136")]
    eq(r[0].split(":")[0], "MODEL EXC ArgumentError", "A: no primary key")
    eq(r[1], "[('emp_id', True, False), ('employee_name', False, True), ('basic_salary', False, False)]", "B: nullability swapped")
    want = "[('emp_id', True, False), ('employee_name', False, False), ('basic_salary', False, True)]"
    eq((r[2], r[3]), (want, want), "C and D: nullable defaults to True")


CV = CODE["parent:640653690106"][0]


@check("Tdb-sql-14")
def pyq_640653690107():
    r = orm(CV, ['ch = Channel(name="c")', "db.session.add(ch)", "db.session.commit()", 'db.session.add_all([Video(name="v1", channel=ch.id), Video(name="v2", channel=ch.id)])', "db.session.commit()", "print(ch.videos)"])
    eq(r, "[<Video 1>, <Video 2>]", "one channel, many videos")


@check("Tdb-sql-15")
def pyq_640653690108():
    pre = ['ch1 = Channel(name="c")', "db.session.add(ch1)", "db.session.commit()"]
    got = []
    for o in options("640653690108"):
        got.append(orm(CV, pre + shell(o).splitlines() + ["print(vid1.channel, vid1.playlist, ch1.videos)"]))
    eq(got[0], "EXC ProgrammingError: (sqlite3.ProgrammingError) Error binding parameter 2: type 'Channel' is not supported", "A: an object in an integer column")
    eq((got[1], got[2]), ("1 <Channel 1> [<Video 1>]",) * 2, "B and C work")
    eq(got[3], "EXC AttributeError: 'int' object has no attribute '_sa_instance_state'", "D: an id given to the backref")


UP = CODE["parent:6406532035122"][0]


@check("Tdb-sql-16")
def pyq_6406532035123():
    r = orm(UP, ['u = User(uname="a")', "db.session.add(u)", "db.session.commit()", 'db.session.add(Profile(name="p", user_id=u.id))', "db.session.commit()", "print(type(u.profile).__name__)",
                 'db.session.add(Profile(name="q", user_id=u.id))', "db.session.commit()"])
    eq(r.splitlines(), ["Profile", "EXC IntegrityError: (sqlite3.IntegrityError) UNIQUE constraint failed: profile.user_id"], "one profile per user; profile is a single object")


@check("Tdb-sql-17")
def pyq_6406532035124():
    lines = shell(CODE["6406532035124"][0]).splitlines()
    eq(orm(UP, lines + ["print(p1.user_id, user1.profile)"]), "None None", "as written: u1.id was None when p1 was built")
    fixed = ['u1 = User(uname = "Jane", pwd = "1234")', "db.session.add(u1)", "db.session.commit()", 'p1 = Profile(name = "Analyst", email = "zoozle.com", user_id = u1.id)', "db.session.add(p1)", "db.session.commit()",
             'user1 = User.query.filter_by(uname="Jane").first()', "user1.profile"]
    eq(orm(UP, fixed), "<Profile 1>", "commit the user first: the shell shows <Profile 1>")
    eq(orm(UP, ['u1 = User(uname = "Jane")', 'p1 = Profile(name = "Analyst", user = u1)', "db.session.add_all([u1, p1])", "db.session.commit()", "u1.profile"]), "<Profile 1>", "or link the objects")


# ================= session and CRUD
EMP = 'class Employee(db.Model):\n    id = db.Column(db.Integer, primary_key=True)\n    first_name = db.Column(db.String)\n    last_name = db.Column(db.String)\n    email = db.Column(db.String)\n'
EMP_ROWS = ['db.session.add_all([Employee(id=i, first_name=f, last_name=l, email=e) for i, f, l, e in [(1, "Ruhil", "Verma", "verma@gmail.com"), (2, "Monica", "gulati", "manisha@gmail.com"), (3, "Sandeep", "Sharma", "sharma@gmail.com"), (4, "Taapsi", "Uma", "uma@gmail.com")]])', "db.session.commit()"]


@check("Tdb-sql-18")
def pyq_640653351989():
    eq(orm(EMP, EMP_ROWS + [shell(CODE["640653351989"][0])]), "EXC NameError: name 'first_name' is not defined", "print(first_name) has no such variable")
    fixed = shell(CODE["640653351989"][0]).replace("print(first_name)", "print(emp1.first_name)")
    eq(orm(EMP, EMP_ROWS + [fixed]), "Ruhil\nManisha\nSandeep\nTaapsi", "with emp1.first_name")


ST = 'class Student(db.Model):\n    __tablename__ = "student"\n    s_id = db.Column(db.Integer, primary_key=True, autoincrement=True)\n    roll_number = db.Column(db.String, nullable=False, unique=True)\n    first_name = db.Column(db.String, nullable=False)\n    last_name = db.Column(db.String, nullable=False)\n'


def student_run(qid):
    return orm(ST, [shell(CODE[qid][1]).replace("\n        print", "\n    print")]).split()


@check("Tdb-sql-19")
def pyq_640653586807():
    eq(student_run("640653586807"), ["Ansh", "Maurya", "Yash", "Maurya", "Ansh", "Raj"], "only the first Yash changes")


@check("Tdb-sql-20")
def pyq_640653690102():
    eq(student_run("640653690102"), ["Harry", "Luther", "John", "Luther", "Harry", "Doe"], "only the first John changes")


LO = 'class Loans(db.Model):\n    ID = db.Column(db.Integer, primary_key=True)\n    application_date = db.Column(db.String)\n    approved_status = db.Column(db.String)\n    Remarks = db.Column(db.String)\n'
LO_ROWS = ['db.session.add_all([Loans(ID=i, application_date=d, approved_status=s, Remarks=r) for i, d, s, r in [(1, "27/01/2023", "Yes", "All docs verified"), (2, "29/03/2023", "No", "The mortgage doc is missing"), (3, "13/04/2023", "No", "The payslip doc is not enclosed"), (4, "03/08/2023", "No", "TDS doc is not enclosed"), (6, "10/12/2023", "Yes", "All docs verified"), (7, "17/12/2023", "Yes", "All docs verified")]])', "db.session.commit()"]


@check("Tdb-sql-21")
def pyq_640653771137():
    eq(orm(LO, LO_ROWS + [CODE["640653771137"][0]]), "EXC AttributeError: 'Loans' object has no attribute 'remarks'", "attribute names are case-sensitive")
    eq(orm(LO, LO_ROWS + [CODE["640653771137"][0].replace("l.remarks", "l.Remarks")]),
       "2 ,  No ,  The mortgage doc is missing\n3 ,  No ,  The payslip doc is not enclosed\n4 ,  No ,  TDS doc is not enclosed", "rows 2, 3, 4")


@check("Tdb-sql-22")
def pyq_640653856984():
    app = CODE["640653856984"][0]
    res = []
    for o in options("640653856984"):
        for imp in ("from app.py import *", "from app import *"):
            code = shell(o).replace("from app.py import *", imp)
            probe = "import subprocess, sys, os\nopen('app.py','w').write(%r)\np = subprocess.run([sys.executable, '-c', %r], capture_output=True, text=True)\n" % (app, code)
            probe += "err = (p.stderr.strip().splitlines() or [''])[-1]\n"
            probe += "q = subprocess.run([sys.executable, '-c', 'from app import *\\ndb.create_all()\\nprint(MaxScores.query.count())'], capture_output=True, text=True)\n"
            probe += "print(err.split(':')[0] or 'ok', q.stdout.strip())\n"
            o2, e2, rc = run_py(probe, timeout=60)
            res.append(o2.strip())
    eq(res[0::2], ["ModuleNotFoundError 0"] * 4, "as written: `from app.py import *` fails before anything runs")
    eq(res[1::2], ["ok 1", "TypeError 0", "TypeError 0", "ok 0"], "with `from app import *`: only A saves the row")


PR = 'class Product(db.Model):\n    id = db.Column(db.Integer, primary_key=True)\n    name = db.Column(db.String)\n    type = db.Column(db.String)\n    form = db.Column(db.String)\n    quantity = db.Column(db.Integer)\n'
PR_ROWS = ['db.session.add_all([Product(id=i, name=n, type=t, form=f, quantity=q) for i, n, t, f, q in [(1001, "Cold Drinks", "edible", "liquid", 100), (1002, "Detergent", "non-edible", "liquid", 126), (1005, "Rugs", "non-edible", "solid", 345), (1008, "LPG Cylinders", "accessories", "solid", 236), (1009, "Curd", "edible", "semi-solid", 520)]])', "db.session.commit()"]


@check("Tdb-sql-23")
def pyq_6406531021276():
    show = "print([(p.id, p.type, p.form, p.quantity) for p in Product.query.filter(Product.id.in_([1001, 1009])).all()])"
    r = [orm(PR, PR_ROWS + [shell(o), show]) for o in options("6406531021276")]
    eq(r[1], "[(1001, 'perishable', 'liquid', 550), (1009, 'edible', 'semi-solid', 520)]", "B: only the edible liquid, +450")
    eq(r[0], "[(1001, 'perishable', 'liquid', 450), (1009, 'perishable', 'semi-solid', 450)]", "A: curd too, and = 450")
    eq(r[3], "[(1001, 'edible', 'perishable', 550), (1009, 'edible', 'perishable', 970)]", "D: changes form")


SS = 'class Student(db.Model):\n    __tablename__ = "students"\n    ID = db.Column(db.Integer, primary_key=True)\n    First_name = db.Column(db.String)\n    Last_name = db.Column(db.String)\n    Email = db.Column(db.String)\n'
SS_ROWS = ['db.session.add_all([Student(ID=i, First_name=f, Last_name=l, Email=e) for i, f, l, e in [(1, "Arjun", "Kumar", "arjun@example.com"), (2, "Karthik", "Kumar", "karthik@example.com"), (3, "Pranav", "Kumar", "pranav@example.com"), (4, "Surya", None, "surya@example.com"), (5, "Harish", "Vignesh", "harisj@example.com"), (6, "Karthik", "Ramesh", "ramesh@example.com"), (7, "Karthik", "Kumar", "kumar@example.com")]])', "db.session.commit()"]


@check("Tdb-sql-24")
def pyq_6406531173009():
    eq(orm(SS, SS_ROWS + [CODE["6406531173009"][0]]).splitlines(), ["Arjun Kumar", "Vikram Kumar", "Pranav Kumar", "Surya None", "Harish Vignesh", "Karthik Ramesh", "Karthik Kumar"], "first() changes one row; a NULL prints as None")


ES = "class ExamScores(db.Model):\n    id = db.Column(db.Integer, primary_key=True)\n    score = db.Column(db.Integer)\n"
ES_ROWS = ["db.session.add_all([ExamScores(id=1, score=57), ExamScores(id=2, score=98), ExamScores(id=3, score=83)])", "db.session.commit()"]


@check("Tdb-sql-25")
def pyq_6406531325141():
    r = [orm(ES, ES_ROWS + [o.replace(">>> ", "")]) for o in options("6406531325141")]
    eq(r[1], "98", "B: scalar() gives the number")
    eq(r[2].split()[:2], ["SELECT", "max(exam_scores.score)"], "C prints the query, not the value")
    eq((r[0], r[3]), ("EXC AttributeError: 'function' object has no attribute 'max'",) * 2, "A, D: session.query is a function")


@check("Tdb-sql-26")
def pyq_6406532180391():
    eq(orm(CODE["6406532180391"][0], shell(CODE["6406532180391"][1]).splitlines()), "1", "only pxyz@... starts with p")
    eq(orm(CODE["6406532180391"][0], ['db.session.add(User(mail_id="Pq@x", password="1"))', "db.session.commit()", "print(User.query.filter(User.mail_id.like('p%')).count())"]), "1", "SQLite LIKE ignores ASCII case")


OR = 'class Order(db.Model):\n    __tablename__ = "orders"\n    id = db.Column(db.Integer, primary_key=True)\n    cust_id = db.Column(db.String)\n    status = db.Column(db.String)\n    amount = db.Column(db.Integer)\n'
OR_ROWS = ['db.session.add_all([Order(id=i, cust_id=c, status=s, amount=a) for i, c, s, a in [(1, "C101", "PAID", 500), (2, "C102", "PENDING", 1200), (3, "C101", "PAID", 800), (4, "C103", "CANCELLED", 400), (5, "C102", "PAID", 1200)]])', "db.session.commit()"]


@check("Tdb-sql-27")
def pyq_6406532180396():
    r = [orm(OR, OR_ROWS + [o.replace("\\\n", " "), "print([o.id for o in order_records])"]) for o in options("6406532180396")]
    eq(r[:3], ["[1, 3, 5]", "[3, 5]", "[2, 3, 5]"], "A keeps only one condition, B both, C only the second")
    eq(r[3].split(":")[0], "EXC AttributeError", "D does not select Order rows")


SM = "class Salesman(db.Model):\n    sid = db.Column(db.Integer, primary_key=True)\n    name = db.Column(db.String)\n    sales_amount = db.Column(db.Integer)\n"
SM_ROWS = ['db.session.add_all([Salesman(sid=s, name=n, sales_amount=a) for s, n, a in [(101, "Ram", 7800), (102, "Rahim", 4560), (103, "Krishna", 8900), (104, "David", 12300), (105, "Kittu", 16700)]])', "db.session.commit()"]


@check("Tdb-sql-28")
def pyq_6406531173012():
    r = [orm(SM, SM_ROWS + [o, "print([s.name for s in sales_man])"]) for o in options("6406531173012")]
    eq(r[:2], ["['Ram', 'Krishna']"] * 2, "& and and_ both build SQL AND")
    eq(r[2:], ["EXC NameError: name 'sales_amount' is not defined"] * 2, "bare column names are not Python names")
    eq(orm(SM, SM_ROWS + ["Salesman.query.filter_by(Salesman.sales_amount >= 5000)"]), "EXC TypeError: Query.filter_by() takes 1 positional argument but 2 were given", "filter_by takes keywords only")


GR = CODE["parent:6406531325153"][0].replace("from flask_sqlalchemy import SQLAlchemy\n", "").replace("db = SQLAlchemy()\n", "")
GR_ROWS = ['db.session.add_all([GlassRepair(id=1, broken_at=date(2024, 1, 1), fixed_at=date(2024, 1, 3), status="fixed"), GlassRepair(id=2, broken_at=date(2024, 1, 1), fixed_at=date(2024, 1, 20), status="fixed"), GlassRepair(id=3, broken_at=date(2024, 1, 28), fixed_at=date(2024, 2, 10), status="fixed"), GlassRepair(id=4, broken_at=date(2024, 1, 1), fixed_at=date(2024, 3, 1), status="open")])', "db.session.commit()"]


def repairs(qid):
    return [orm(GR, GR_ROWS + [o + ("\nresult = repairs" if "result" not in o else ""), "print(result)"]) for o in options(qid)]


@check("Tdb-sql-29")
def pyq_6406531325154():
    r = repairs("6406531325154")
    eq(r[:2], ["[(1, 2), (2, 19), (3, 13), (4, 60)]"] * 2, "A, B: subtract dates in Python")
    eq(r[2], "EXC TypeError: 'Query' object is not callable", "C: Model.query is not a function")
    eq(r[3], "EXC TypeError: unsupported type for timedelta days component: datetime.timedelta", "D: the difference is already a timedelta")


@check("Tdb-sql-30")
def pyq_6406531325155():
    r = repairs("6406531325155")
    eq((r[0], r[2]), ("[(2, 19), (3, 13)]",) * 2, "A and C filter in Python")
    eq(r[1], "[]", "B: SQLite subtracts the date text as numbers")
    eq(r[3], "EXC TypeError: 'Query' object is not callable", "D")
    eq(orm(GR, GR_ROWS + ["print(db.session.query(GlassRepair.fixed_at - GlassRepair.broken_at).all())"]), "[(0,), (0,), (0,), (0,)]", "'2024-01-20' - '2024-01-01' is 2024 - 2024")


# ================= lesson claims
@check("Tdb-sql-31")
def column_defaults():
    m = 'class MaxScores(db.Model):\n    course_id = db.Column(db.String(10), primary_key=True)\n    high_score = db.Column(db.Integer)\n'
    eq(orm(m, ["print(MaxScores.__tablename__, MaxScores.__table__.c.course_id.nullable, MaxScores.__table__.c.high_score.nullable)"]), "max_scores False True", "default table name; nullable defaults")
    eq(orm(m, ["MaxScores('cs2002', 86)"]), "EXC TypeError: __init__() takes 1 positional argument but 3 were given", "keyword arguments only")


@check("Tdb-sql-32")
def session_states():
    m = "class T(db.Model):\n    id = db.Column(db.Integer, primary_key=True)\n    n = db.Column(db.String)\n"
    eq(orm(m, ['t = T(n="a")', "print(t.id)", "db.session.add(t)", "print(t.id)", "db.session.commit()", "print(t.id)"]), "None\nNone\n1", "the id appears at the flush/commit")
    eq(orm(m, ['db.session.add(T(n="a"))', "db.session.rollback()", "print(T.query.count())"]), "0", "rollback drops an uncommitted add")
    eq(orm(m, ['db.session.add_all([T(n="a"), T(n="b")])', "db.session.commit()", "db.session.delete(T.query.get(1))", "db.session.commit()", "print([x.n for x in T.query.all()])"]), "['b']", "delete then commit")


@check("Tdb-sql-33")
def filter_by_and_first():
    m = "class T(db.Model):\n    id = db.Column(db.Integer, primary_key=True)\n    a = db.Column(db.String)\n    b = db.Column(db.String)\n"
    rows = ['db.session.add_all([T(id=3, a="x", b="1"), T(id=1, a="x", b="2"), T(id=2, a="y", b="1")])', "db.session.commit()"]
    eq(orm(m, rows + ['print([t.id for t in T.query.filter_by(a="x", b="1").all()])']), "[3]", "two keywords = AND")
    eq(orm(m, rows + ['print(T.query.filter_by(a="x").first().id, T.query.filter_by(a="z").first())']), "1 None", "first() in id order here; None when nothing matches")
    eq(orm(m, rows + ['print([t.id for t in T.query.filter((T.a == "y") | (T.b == "2")).order_by(T.id).all()])']), "[1, 2]", "| is OR")


@check("Tdb-sql-34")
def python_and_on_conditions():
    eq(orm(OR, ['c = (Order.status == "PAID") and (Order.amount > 500)', "print(c)"]), "orders.status = :status_1", "`and` returns one of the two conditions")



# ================= depth upgrade (MLT pattern)
P7 = ("create table p(m, prod, q, cost);"
      "insert into p values('A','Biscuits',3,100),('B','Shoes',2,500),('A','Chocolate',10,200),('C','Pen',20,50),('B','Shirts',5,700),('D','Beverages',30,150),('C','Notebook',40,250);")


@check("Tdb-sql-35")
def index_query_plan():
    o, e, rc = run_py("import sqlite3\nc=sqlite3.connect(':memory:')\nc.executescript(\"create table u(id integer primary key, email text);\")\n"
                      "c.executemany('insert into u(email) values (?)', [('u%d@x' % i,) for i in range(2000)])\n"
                      "q=\"explain query plan select * from u where email='u5@x'\"\nprint(c.execute(q).fetchall()[0][-1])\nc.execute('create index ix on u(email)')\nprint(c.execute(q).fetchall()[0][-1])\n")
    eq(o.strip().splitlines(), ["SCAN u", "SEARCH u USING COVERING INDEX ix (email=?)"], "without an index SQLite scans; with one it searches (covering: the index holds every column needed)")


@check("Tdb-sql-36")
def sql_more():
    eq(sql(P7, "select m, prod from p order by m desc, q asc"), [("D", "Beverages"), ("C", "Pen"), ("C", "Notebook"), ("B", "Shoes"), ("B", "Shirts"), ("A", "Biscuits"), ("A", "Chocolate")], "two sort keys")
    eq(sql(P7, "select count(distinct m), count(*) from p"), [(4, 7)], "COUNT(DISTINCT)")
    eq(sql(P7, "select prod from p where m='A' or m='B' and q>4"), [("Biscuits",), ("Chocolate",), ("Shirts",)], "AND binds tighter than OR")
    eq(sql(P7, "select prod from p where (m='A' or m='B') and q>4"), [("Chocolate",), ("Shirts",)], "brackets change it")
    eq(sql(P7, "select prod from p order by cost desc limit 2"), [("Shirts",), ("Shoes",)], "ORDER BY then LIMIT")


@check("Tdb-sql-37")
def sqlite_types_and_null():
    eq(sql("", "select '10' < '9', 10 < 9"), [(1, 0)], "text compares letter by letter")
    eq(sql("", "select NULL = NULL, NULL IS NULL"), [(None, 1)], "NULL = NULL is unknown")
    eq(sql("create table n(x); insert into n values(1),(NULL),(3);", "select (select count(*) from n where x = NULL), (select count(*) from n where x is null)"), [(0, 1)], "use IS NULL")
    eq(sql("create table ti(v integer); insert into ti values('5'),('abc');", "select v, typeof(v) from ti"), [(5, "integer"), ("abc", "text")], "type affinity")


@check("Tdb-sql-38")
def string_length_not_enforced():
    m = "class T(db.Model):\n    id = db.Column(db.Integer, primary_key=True)\n    s = db.Column(db.String(5))\n"
    eq(orm(m, ['db.session.add(T(s="much longer than five"))', "db.session.commit()", "print(T.query.first().s)"]), "much longer than five", "SQLite does not enforce String(5)")


M2M = """enroll = db.Table("enroll", db.Column("student_id", db.Integer, db.ForeignKey("student.id")), db.Column("course_id", db.Integer, db.ForeignKey("course.id")))
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    courses = db.relationship("Course", secondary=enroll, backref="students")
class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String)
"""


@check("Tdb-sql-39")
def many_to_many_secondary():
    r = orm(M2M, ['a = Student(name="A"); b = Student(name="B"); w = Course(title="Web"); d = Course(title="DB")', "a.courses = [w, d]; b.courses = [w]", "db.session.add_all([a, b]); db.session.commit()",
                  'print(sorted(c.title for c in a.courses), sorted(s.name for s in w.students), db.session.execute(db.text("select count(*) from enroll")).scalar())'])
    eq(r, "['DB', 'Web'] ['A', 'B'] 3", "secondary= fills the association table (list order is not guaranteed without order_by)")


CV2 = """class Channel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    videos = db.relationship("Video", backref="playlist")
class Video(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    channel = db.Column(db.Integer, db.ForeignKey("channel.id"))
"""


@check("Tdb-sql-40")
def append_and_delete_parent():
    eq(orm(CV2, ['ch = Channel(name="c"); v = Video(name="v")', "ch.videos.append(v)", "db.session.add(ch); db.session.commit()", "print(v.channel, v.playlist.name)"]), "1 c", "append fills the key; adding the parent adds the child")
    eq(orm(CV2, ['ch = Channel(name="c"); v = Video(name="v", playlist=ch)', "db.session.add(ch); db.session.commit()", "db.session.delete(ch); db.session.commit()", "print(Video.query.count(), Video.query.first().channel)"]), "1 None", "deleting the parent leaves the child with a NULL key")


U1 = "class U(db.Model):\n    id = db.Column(db.Integer, primary_key=True)\n    e = db.Column(db.String, unique=True)\n"


@check("Tdb-sql-41")
def rollback_after_error():
    r = orm(U1, ['db.session.add(U(e="a")); db.session.commit()', 'db.session.add(U(e="a"))',
                 "try:\n    db.session.commit()\nexcept Exception as ex:\n    print(type(ex).__name__)",
                 "try:\n    print(U.query.count())\nexcept Exception as ex:\n    print(type(ex).__name__)",
                 "db.session.rollback()", "print(U.query.count())", "print(db.session.get(U, 1).e, db.session.get(U, 9))"])
    eq(r.splitlines(), ["IntegrityError", "PendingRollbackError", "1", "a None"], "after a failed commit, roll back before the next query")


PQ = "class P(db.Model):\n    id = db.Column(db.Integer, primary_key=True)\n    name = db.Column(db.String)\n    cost = db.Column(db.Integer)\n    m = db.Column(db.String)\n"
PQ_ROWS = ['db.session.add_all([P(name=n, cost=c, m=m) for n, c, m in [("Biscuits", 100, "A"), ("Shoes", 500, "B"), ("Chocolate", 200, "A"), ("Pen", 50, "C"), ("Shirts", 700, "B")]]); db.session.commit()']


@check("Tdb-sql-42")
def query_toolkit():
    r = orm(PQ, PQ_ROWS + ["print([p.name for p in P.query.order_by(P.cost.desc()).limit(2).all()])", 'print(P.query.filter(P.m.in_(["A", "C"])).count())',
                           "print(db.session.query(P.m, func.count(P.id)).group_by(P.m).order_by(P.m).all())", 'print(P.query.filter(P.name.like("s%")).count())',
                           "print(db.session.query(func.sum(P.cost)).scalar(), db.session.query(func.avg(P.cost)).scalar())", "print(P.query.filter(P.cost > 150).order_by(P.name).first().name)"])
    eq(r.splitlines(), ["['Shirts', 'Shoes']", "3", "[('A', 2), ('B', 2), ('C', 1)]", "2", "1550 310.0", "Chocolate"], "order_by, limit, in_, group_by, like, sum, avg, first")



JN = ("create table course(id integer primary key, title text); insert into course values(10,'Web'),(20,'DB'),(30,'AI');"
      "create table enrollment(id integer primary key, name text, course_id int); insert into enrollment values(1,'Asha',10),(2,'Ravi',10),(3,'Meera',20),(4,'Zoya',NULL);")


@check("Tdb-sql-43")
def joins():
    eq(sql(JN, "select e.name, c.title from enrollment e join course c on e.course_id = c.id order by e.id"), [("Asha", "Web"), ("Ravi", "Web"), ("Meera", "DB")], "inner join keeps matching pairs only")
    eq(sql(JN, "select c.title, count(e.id) from course c left join enrollment e on e.course_id = c.id group by c.id order by c.id"), [("Web", 2), ("DB", 1), ("AI", 0)], "left join keeps every course, with 0 for none")
    eq(sql(JN, "select c.title, count(*) from course c left join enrollment e on e.course_id = c.id group by c.id order by c.id"), [("Web", 2), ("DB", 1), ("AI", 1)], "COUNT(*) counts the NULL row")


@check("Tdb-sql-44")
def orm_join():
    m = ("class Course(db.Model):\n    id = db.Column(db.Integer, primary_key=True)\n    title = db.Column(db.String)\n"
         "class Enrollment(db.Model):\n    id = db.Column(db.Integer, primary_key=True)\n    name = db.Column(db.String)\n    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))\n")
    rows = ['db.session.add_all([Course(id=10, title="Web"), Course(id=20, title="DB"), Enrollment(name="Asha", course_id=10), Enrollment(name="Ravi", course_id=10), Enrollment(name="Meera", course_id=20)])', "db.session.commit()"]
    eq(orm(m, rows + ['print([e.name for e in Enrollment.query.join(Course).filter(Course.title == "Web").order_by(Enrollment.name).all()])']), "['Asha', 'Ravi']", "join, then filter on the other table")


@check("Tdb-sql-45")
def transaction_all_or_nothing():
    m = "class A(db.Model):\n    id = db.Column(db.Integer, primary_key=True)\n    bal = db.Column(db.Integer, nullable=False)\n"
    cmds = ["db.session.add_all([A(id=1, bal=100), A(id=2, bal=50)]); db.session.commit()",
            "a = db.session.get(A, 1); b = db.session.get(A, 2)", "a.bal -= 30", "b.bal = None",
            "try:\n    db.session.commit()\nexcept Exception as ex:\n    print(type(ex).__name__)\n    db.session.rollback()",
            "print(db.session.get(A, 1).bal, db.session.get(A, 2).bal)"]
    eq(orm(m, cmds), "IntegrityError\n100 50", "one failing change rolls back the whole transfer")


if __name__ == "__main__":
    main()
