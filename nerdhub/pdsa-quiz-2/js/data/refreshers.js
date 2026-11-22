PDSA.refreshers=[
{id:"powers-logs",title:"Maths: powers, logs and how fast things grow",blocks:[
 {t:"p",md:"Almost every complexity answer uses **powers of 2** and **logarithms**. This page gives you only what the PYQs need."},
 {t:"co",kind:"def",title:"Power and logarithm",md:"$2^k$ means 2 multiplied by itself $k$ times: $2^3=8$.\n\n$\\log_2 n$ asks: *to what power must I raise 2 to get $n$?* So $\\log_2 8=3$ because $2^3=8$.\n\nIn plain words: **$\\log_2 n$ is how many times you can halve $n$ before you reach 1.**"},
 {t:"table",head:["$n$","1","2","4","8","16","32","64","1024"],rows:[["$\\log_2 n$","0","1","2","3","4","5","6","10"]]},
 {t:"co",kind:"analogy",md:"Halving a 1024-page book again and again: 512, 256, 128, 64, 32, 16, 8, 4, 2, 1. That is **10 halvings**, and $\\log_2 1024=10$. This is why binary search on a million items needs only about 20 steps."},
 {t:"co",kind:"formula",title:"Rules you need",md:"$2^a\\cdot 2^b=2^{a+b}$ and $\\log_2(2^k)=k$.\n\n$\\log_b a=\\dfrac{\\log a}{\\log b}$. So $\\log_2 5\\approx 2.32$ and $\\log_2 3\\approx 1.58$."},
 {t:"ex",level:"simple",title:"How many times can 64 be halved to reach 1?",problem:"Count halvings of 64.",asked:"The number of halvings, which is $\\log_2 64$.",idea:"Halve repeatedly and count.",steps:["64 → 32 (1)","32 → 16 (2)","16 → 8 (3)","8 → 4 (4)","4 → 2 (5)","2 → 1 (6)"],ans:"6 halvings, so $\\log_2 64=6$"},
 {t:"co",kind:"tip",title:"Growth order you must memorise",md:"From slowest to fastest growth: $1<\\log n<n<n\\log n<n^2<n^3<2^n$.\n\nIn a **sum** of terms, keep only the fastest-growing one: $n^2+5n+100$ is $O(n^2)$."}
],quiz:[
 {id:"rf-m1",concept:"Logs",type:"SA",stem:"What is $\\log_2 256$?",num:{ans:8},diff:"easy",explain:"$2^8=256$. Or halve 256 repeatedly: 128, 64, 32, 16, 8, 4, 2, 1. That is 8 halvings."},
 {id:"rf-m2",concept:"Growth order",type:"MCQ",stem:"Which grows fastest as $n$ becomes very large?",options:["$n\\log n$","$n^2$","$2^n$","$n^3$"],key:[2],diff:"easy",explain:"Exponential growth $2^n$ beats every polynomial. For $n=30$: $2^{30}\\approx 10^9$ while $n^3=27000$.",why:{A:"Slower than $n^2$.",B:"Polynomial; beaten by $2^n$.",C:"Exponential, the fastest here.",D:"Polynomial; beaten by $2^n$."}},
 {id:"rf-m3",concept:"Simplifying",type:"MCQ",stem:"$3n^2+50n+7$ is:",options:["$O(n)$","$O(n^2)$","$O(n^3)$","$O(50n)$"],key:[1],diff:"easy",explain:"Keep the fastest-growing term $3n^2$ and drop the constant 3. The result is $O(n^2)$.",why:{A:"Too small. $n^2$ outgrows $n$.",B:"Correct.",C:"Valid as a loose bound but not the nearest one.",D:"Not a standard form, and too small."}}
]},
{id:"sums",title:"Maths: sums like 1 + 2 + … + n",blocks:[
 {t:"co",kind:"formula",title:"The two sums that appear",md:"$1+2+\\dots+n=\\dfrac{n(n+1)}{2}$, which is $O(n^2)$.\n\n$1+2+4+\\dots+2^{k}=2^{k+1}-1$ (a doubling sum is about **twice its last term**)."},
 {t:"co",kind:"analogy",md:"Pair the first and last terms: $1+n$, $2+(n-1)$, … Every pair adds to $n+1$ and there are $n/2$ pairs. That is $\\frac{n}{2}(n+1)$."},
 {t:"ex",level:"simple",title:"Sum of 1 to 100",problem:"Find $1+2+\\dots+100$.",steps:["Use $n(n+1)/2$ with $n=100$.","$100\\times101/2=5050$."],ans:"5050"},
 {t:"co",kind:"notice",md:"Maximum inversions in a list of $n$ items is $\\binom n2=\\frac{n(n-1)}{2}$. That is the sum $1+2+\\dots+(n-1)$. You will use this in Divide and Conquer."}
],quiz:[
 {id:"rf-s1",concept:"Sum formula",type:"SA",stem:"Compute $1+2+3+\\dots+16$.",num:{ans:136},diff:"easy",explain:"$16\\cdot17/2=136$."},
 {id:"rf-s2",concept:"Doubling sum",type:"SA",stem:"Compute $1+2+4+8+16+32$.",num:{ans:63},diff:"medium",explain:"The last term is $2^5=32$, so the sum is $2^6-1=63$."},
 {id:"rf-s3",concept:"Sum growth",type:"MCQ",stem:"$1+2+\\dots+n$ grows like:",options:["$n$","$n\\log n$","$n^2$","$2^n$"],key:[2],diff:"easy",explain:"It equals $n(n+1)/2$, which is $O(n^2)$.",why:{A:"Too slow.",B:"No.",C:"Correct.",D:"Too fast."}}
]},
{id:"py-index",title:"Python: indices, slicing and range",blocks:[
 {t:"p",md:"Exam code uses `//`, `range`, slicing and recursion. Most wrong answers come from **off-by-one** errors, so let us be exact."},
 {t:"co",kind:"def",title:"Indexing starts at 0",md:"For `L = [10, 20, 30, 40]`: `L[0]` is 10, `L[3]` is 40, and `L[-1]` is 40 (last element). The length is 4 but the last valid index is 3."},
 {t:"co",kind:"def",title:"Slicing `L[a:b]`",md:"Takes positions $a, a+1, \\dots, b-1$. The end `b` is **not included**. So `L[1:3]` is `[20, 30]`. `L[i:i+5]` takes up to 5 items starting at `i`."},
 {t:"co",kind:"def",title:"`range(start, stop, step)`",md:"Counts `start, start+step, …` and stops **before** `stop`. `range(0, 10, 5)` gives `0, 5`. `range(3, -1, -1)` gives `3, 2, 1, 0`."},
 {t:"co",kind:"def",title:"`//` versus `/`",md:"`7 // 2` is `3` (floor division, drops the fraction). `7 / 2` is `3.5`. For `mid = (low + high) // 2` the middle is rounded **down**."},
 {t:"code",title:"Try these in your head",code:"L = [7, 13, 5, 18, 9, 33]\nprint(L[1:4])\nprint(list(range(0, len(L), 5)))\nprint(len(L) // 2)\nprint(L[len(L) // 2])",lex:[["2","Positions 1, 2, 3 → `[13, 5, 18]`."],["3","`range(0, 6, 5)` gives 0 and 5 → `[0, 5]`."],["4","6 // 2 = 3."],["5","`L[3]` is 18."]]},
 {t:"co",kind:"warn",md:"In the Median-of-Medians code the **middle** of a 5-element sorted block is `X[2]`, not `X[3]`. A block with fewer than 5 items uses `X[len(X)//2]`."}
],quiz:[
 {id:"rf-p1",concept:"Slicing",type:"MCQ",stem:"`L = [4, 8, 15, 16, 23, 42]`. What is `L[2:5]`?",options:["[15, 16, 23]","[8, 15, 16, 23]","[15, 16, 23, 42]","[15, 16]"],key:[0],diff:"easy",explain:"Positions 2, 3, 4 are 15, 16, 23. Position 5 is excluded.",why:{A:"Correct.",B:"Starts at position 1.",C:"Includes position 5, which is excluded.",D:"Stops one early."}},
 {id:"rf-p2",concept:"range",type:"SA",stem:"How many numbers does `range(2, 20, 3)` produce?",num:{ans:6},diff:"medium",explain:"It gives 2, 5, 8, 11, 14, 17. The next would be 20, which is excluded. That is 6 numbers."},
 {id:"rf-p3",concept:"Floor division",type:"SA",stem:"What is `(0 + 9) // 2`?",num:{ans:4},diff:"easy",explain:"9 / 2 = 4.5 and floor division drops the .5, giving 4."}
]},
{id:"py-recursion",title:"Python: recursion and the call stack",blocks:[
 {t:"p",md:"A **recursive** function solves a problem by calling itself on a smaller problem. It needs a **base case** that stops the calls."},
 {t:"code",title:"Sum of a list by recursion",code:"def total(L):\n    if len(L) == 0:\n        return 0\n    return L[0] + total(L[1:])\n\nprint(total([3, 4, 5]))",lex:[["2-3","Base case: an empty list sums to 0."],["4","Take the first item and add the sum of the rest."],["6","Prints 12."]]},
 {t:"trace",title:"Trace of total([3, 4, 5])",head:["Call","Waiting to add","Returns"],rows:[["total([3,4,5])","3 + ?","3 + 9 = 12"],["total([4,5])","4 + ?","4 + 5 = 9"],["total([5])","5 + ?","5 + 0 = 5"],["total([])","base case","0"]],foot:"Calls go **down** the table until the base case. Answers come back **up**, newest call first.",noteLast:false},
 {t:"co",kind:"analogy",md:"A stack of plates. Each call puts a plate on top. When a call returns, its plate is taken off. The top plate always finishes first."},
 {t:"co",kind:"notice",md:"To find the cost $T(n)$ of a recursive function, count (1) how many recursive calls it makes, (2) how big each call is, and (3) how much extra work it does around the calls. This gives the **recurrence** you will learn in Divide and Conquer."}
],quiz:[
 {id:"rf-r1",concept:"Recursion",type:"MCQ",stem:"What does this program print?",code:"def f(n):\n    if n == 0:\n        return 0\n    return n + f(n - 1)\n\nprint(f(4))",options:["4","10","24","0"],key:[1],diff:"easy",explain:"f(4)=4+f(3)=4+3+f(2)=…=4+3+2+1+0=10.",why:{A:"Only the first term.",B:"Correct.",C:"That would be a product.",D:"Only the base case."}},
 {id:"rf-r2",concept:"Base case",type:"MCQ",stem:"What happens if a recursive function has no base case?",options:["It returns 0","It calls itself forever until Python raises a RecursionError","It returns None","It runs once"],key:[1],diff:"easy",explain:"Without a stopping rule the calls never end. Python stops at its recursion limit with a `RecursionError`.",why:{A:"No.",B:"Correct.",C:"No.",D:"No."}}
]}
];
