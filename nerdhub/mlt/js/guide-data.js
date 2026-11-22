/* Guide data, part 1: Decision Trees, k-NN, Cross-validation. Plain text with $math$. Read by js/guide.js. */
window.GUIDE = window.GUIDE || {};

window.GUIDE['decision-trees'] = {
  icon: '🌳', color: '#16a34a',
  one: "A decision tree is a game of <b>twenty questions</b> that the computer plays against your data: at every step it picks the yes/no question that sorts the labels best, and it keeps asking until each group is (almost) one label.",
  story: [
    { h: "The problem", t: "We must predict a <b>class label</b> (yes/no, spam/not spam) from features. Until now labels were numbers, so we used squared error. Now labels are categories, so we simply <b>count mistakes</b> (0-1 loss)." },
    { h: "The idea", t: "Ask a chain of simple yes/no questions, one feature at a time (for example: is $x_2\\le 5$?). Each question splits the points into two groups. Follow your answers down to a <b>leaf</b> and output that leaf's majority label." },
    { h: "The tool: how to choose a question", t: "A good question leaves each group mostly one label. <b>Entropy</b> measures how mixed a group is (0 = pure, 1 = half-half). <b>Information gain</b> = entropy before minus the weighted entropy after. Choose the question with the largest gain." },
    { h: "The shape of the result", t: "Every question draws one line parallel to an axis, so a tree cuts the space into <b>boxes</b>. Depth counts edges, and a tree of depth $m$ has at most $2^m$ leaves. More depth means more boxes and lower training error." },
    { h: "The danger", t: "A very deep tree memorises the training data (<b>overfits</b>); a very shallow tree is too simple (<b>underfits</b>). Depth is a knob you choose with validation data (see Cross-validation)." },
    { h: "How it is tested", t: "Mostly arithmetic: entropy from counts, information gain of a split, which of two questions is better. Then reading a tree, counting depth and leaves, and true/false properties." }
  ],
  mind: {
    center: "Decision Trees",
    branches: [
      { n: "Maths first", sec: "prereq", kids: ["proportion = part ÷ whole", "log base 2 = halvings", "weighted average"] },
      { n: "Prediction", sec: "tree", kids: ["start at the root", "answer yes/no at each node", "leaf gives the majority label"] },
      { n: "Entropy", sec: "entropy", kids: ["0 = pure, 1 = half-half", "symmetric: E(p) = E(1−p)", "only proportions matter", "always log base 2"] },
      { n: "Information gain", sec: "ig", kids: ["parent − weighted children", "weights = child ÷ parent size", "never negative", "pick the largest"] },
      { n: "Numeric questions", sec: "thresh", kids: ["x ≤ θ", "try gaps between sorted values", "keep the θ with best gain"] },
      { n: "Structure", sec: "struct", kids: ["depth = edges, longest path", "leaves ≤ 2^depth", "axis-parallel boxes", "box needs 2d questions"] },
      { n: "Fit and risk", sec: "props", kids: ["too deep: overfit", "too shallow: underfit", "zero train error ≠ good", "unstable to small changes"] }
    ]
  },
  graph: {
    layers: [["data", "q"], ["ent"], ["ig", "grow"], ["pred", "depth", "fit"]],
    nodes: {
      data: { t: "Labelled points", s: "features and class labels" },
      q: { t: "A question", s: "feature ≤ threshold?" },
      ent: { t: "Entropy", s: "how mixed one group is" },
      ig: { t: "Information gain", s: "parent − weighted children" },
      grow: { t: "Grow the tree", s: "ask, split, repeat" },
      pred: { t: "Prediction", s: "follow answers to a leaf" },
      depth: { t: "Depth and leaves", s: "leaves ≤ 2^depth" },
      fit: { t: "Over/underfitting", s: "depth is the knob" }
    },
    edges: [["data", "ent", "label counts give p"], ["q", "ent", "splits data into groups"], ["ent", "ig", "parent and child entropies"], ["ig", "grow", "largest gain wins"], ["grow", "pred", "finished tree"], ["grow", "depth", "more splits"], ["grow", "fit", "too many splits"]]
  },
  secs: {
    prereq: {
      q: "What school maths do I need before touching entropy?",
      why: "Entropy and information gain are only three small ideas glued together: a proportion, a base-2 logarithm and a weighted average. If any of them is shaky, every later step feels hard.",
      plain: "A proportion is part ÷ whole (3 out of 8 is 3/8). $\\log_2 x$ asks: how many times must I double 1 to reach $x$? So $\\log_2 8=3$. A weighted average lets a bigger group count more.",
      remember: ["Proportion = part ÷ whole, always between 0 and 1.", "On a calculator, $\\log_2 x=\\ln x/\\ln 2$. Also $\\log_2 1=0$, $\\log_2 2=1$, and the $\\log_2$ of a fraction below 1 is negative.", "$0\\cdot\\log_2 0$ is taken as $0$.", "Weighted average: multiply each value by its group size, add, then divide by the total size."]
    },
    tree: {
      q: "What is a decision tree, and how does it make a prediction?",
      why: "Everything that follows (entropy, depth, regions) is about building or reading this one object.",
      plain: "Think of twenty questions. The root is the first question. Each answer sends you to a child. A leaf has no question: it just names a label, the majority label of the training points that ended up there.",
      remember: ["Node = a group of points. Internal node = a node that holds a question. Leaf = a node that holds a label.", "To predict: follow the answers from the root to a leaf and output that leaf's majority label.", "A question does not always split the data into two non-empty groups (all points may answer the same way).", "Classifiers are judged by the 0-1 loss: count the wrong predictions."]
    },
    entropy: {
      q: "How do I turn 'how mixed is this group of labels?' into one number?",
      why: "To judge a question we must measure how much purer the groups become. Entropy is that measuring stick, and every information-gain calculation uses it.",
      plain: "Pick a random point from the group and try to guess its label. If the group is all one label you are never wrong (entropy 0). If it is half and half you are as unsure as possible (entropy 1).",
      remember: ["$E(p)=-p\\log_2p-(1-p)\\log_2(1-p)$, where $p$ is the proportion of label 1.", "Pure node: $E=0$. Half-half node: $E=1$, the maximum for two classes.", "Symmetric: $E(p)=E(1-p)$, so 75/25 and 25/75 both give $0.811$.", "Only proportions matter, not counts: 3 and 1, or 300 and 100, both give $0.811$.", "Always $\\log_2$. With $\\ln$ the maximum would come out as $0.693$, not 1."]
    },
    calc: {
      q: "How do I compute entropy quickly and without slips in the exam?",
      why: "Entropy arithmetic is the largest block of marks in your PYQs for this topic, so it has to become automatic.",
      plain: "Four moves, always in this order: counts, then the proportion $p$, then the two terms $-p\\log_2p$ and $-(1-p)\\log_2(1-p)$, then add them.",
      remember: ["Counts → $p$ → two terms → add.", "If the question prints $\\log_2$ values, use those. Round only at the end.", "Quick checks: $E(0.5)=1$, $E(0.25)=0.811$, $E(0.1)=0.469$.", "Write the terms separately before adding. Most lost marks are a dropped minus sign."]
    },
    ig: {
      q: "Which question should the tree ask first?",
      why: "We need a score to compare questions. Information gain says how much less mixed the groups become after asking it.",
      plain: "Before the question the parent group is mixed, with entropy $E(D)$. After it there are two smaller groups, each with its own entropy. Average those two entropies (a bigger group counts more) and subtract from the parent's. The bigger the drop, the better the question.",
      remember: ["$\\text{IG}=E(\\text{parent})-\\sum_c\\frac{n_c}{n}E(\\text{child}_c)$.", "Weights are child size ÷ parent size, never a plain average of the child entropies.", "IG is never negative. IG $=E(\\text{parent})$ is the largest possible: every child pure.", "A split that is 50/50 in size can still have zero gain. Only label purity matters.", "Comparing two questions at the same node: $E(\\text{parent})$ is the same, so the smaller weighted child entropy wins."]
    },
    thresh: {
      q: "How does the tree choose a question on a numeric feature?",
      why: "Real data has numbers, not just yes/no features. The tree turns a number into a question $x\\le\\theta$ and must pick $\\theta$.",
      plain: "Sort the values. The answer to $x\\le\\theta$ can only change in a gap between two neighbouring different values, so only one threshold per gap needs testing. Compute the gain for each and keep the best.",
      remember: ["Question form: $x_j\\le\\theta$ goes to the Yes branch, $x_j>\\theta$ to the No branch.", "Candidate thresholds lie between consecutive distinct sorted values.", "Compute the gain for every candidate on every feature and take the largest.", "On XOR-style data the first question can have zero gain, yet the tree still needs it."]
    },
    struct: {
      q: "What do depth, leaves and regions mean, and how do I read them off a tree?",
      why: "Many PYQs hand you a tree or a picture of regions and ask you to count, predict or rebuild. No entropy is needed there.",
      plain: "Every question draws one straight line parallel to an axis. The leaves are the rectangles left between those lines. Depth is the most questions you can be asked along one path.",
      remember: ["Depth = number of <b>edges</b> on the longest root-to-leaf path (not the number of nodes).", "At depth $m$ there are at most $2^m$ leaves. Number of questions (internal nodes) = leaves − 1.", "Boundaries are axis-parallel: vertical and horizontal lines in 2D, so rectangles and staircases.", "To isolate one box of one class in $d$ dimensions you need $2d$ questions, one per side of the box.", "Predicting a point = asking which rectangle it falls in."]
    },
    props: {
      q: "When does a tree overfit or underfit, and what does that tell me?",
      why: "True/false statements about tree properties, and the link to validation when choosing depth, appear in the PYQs.",
      plain: "Too few questions: the boxes are too big to capture the pattern (underfit). Too many: a tiny box around every training point, memorising noise (overfit). Training error keeps falling with depth, but test error eventually rises.",
      remember: ["Shallow tree: high bias, underfits. Deep tree: high variance, overfits.", "A fully grown tree reaches zero training error provided no two identical points have different labels.", "Zero training error does not mean a good model.", "A depth limit or pruning controls complexity. Choose the depth with validation data.", "Trees are unstable: changing one point can change the very first question.", "A tree stores only its questions. k-NN must keep all the training data."]
    },
    pyqs: {
      q: "Can I actually solve the questions that were asked before?",
      why: "The PYQs show exactly how this topic is tested. Solving them yourself first is the fastest way to find what you have not really learnt.",
      plain: "Attempt each question on paper, then submit and open the solution. Read the solution for the <i>method</i>, not only the number."
    }
  },
  end: {
    props: [
      ["Entropy", "0 for a pure node, 1 for a half-half node, symmetric, depends on proportions only, uses $\\log_2$."],
      ["Information gain", "Parent entropy minus size-weighted child entropy. Never negative. Largest possible value is the parent's entropy."],
      ["Greedy growth", "At each node the tree picks the best question for that node only. It does not search for the best whole tree."],
      ["Depth", "Edges on the longest root-to-leaf path. A single leaf has depth 0."],
      ["Leaves", "At most $2^{\\text{depth}}$. Questions = leaves − 1."],
      ["Decision boundary", "Made of axis-parallel pieces, so regions are boxes."],
      ["Training error", "Falls (or stays) as depth grows. Zero for a fully grown tree when identical points share labels."],
      ["Over/underfitting", "Too deep overfits (high variance). Too shallow underfits (high bias)."],
      ["Prediction cost", "Follow one path: at most the depth. No training points are needed at prediction time."]
    ],
    cues: [
      ["entropy of a node / parent / child", "Counts → $p$ → two terms → add. Use $\\log_2$."],
      ["information gain, which question first", "Six boxes: parent counts, parent $E$, child counts, child $E$, weights, weighted sum then subtract."],
      ["which of two questions is better", "Compare weighted child entropy (parent is the same) or the two gains."],
      ["number of questions / minimum depth to isolate a box", "Count the box sides: $2$ per feature, so $2d$."],
      ["depth, leaves", "Depth in edges. Leaves ≤ $2^{\\text{depth}}$."],
      ["prone to underfit / overfit", "Shallow = underfit, deep = overfit."],
      ["predict with this tree", "Start at the root and follow the answers to a leaf."]
    ],
    traps: ["Using $\\ln$ instead of $\\log_2$.", "Averaging child entropies without weights.", "Counting nodes instead of edges for the depth.", "Believing a 50/50 split in size means high gain.", "Believing zero training error means a good tree.", "Trying to find the majority class before computing entropy (symmetry says you do not need it)."],
    hooks: ["Pure is 0, half-half is 1.", "Gain = parent minus <i>weighted</i> children.", "Weights are sizes, not halves.", "Depth counts edges, not nodes.", "Leaves ≤ 2 to the depth.", "Deep overfits, shallow underfits.", "Axis-parallel cuts make boxes.", "Greedy: best question now, not best tree overall."]
  }
};

window.GUIDE['knn'] = {
  icon: '🏘️', color: '#ea580c',
  one: "k-NN predicts by <b>asking the neighbours</b>: to label a new point, find the $k$ training points closest to it and let them vote (or average their values).",
  story: [
    { h: "The problem", t: "We have labelled points and a new point with no label. We want a prediction without first fitting a formula." },
    { h: "The idea", t: "Similar points tend to share labels. So measure the <b>distance</b> from the new point to every training point, take the $k$ closest, and vote. For numeric labels (regression) take the average instead." },
    { h: "The one knob: $k$", t: "$k=1$ copies the single nearest label (very wiggly boundary, zero training error). Large $k$ averages over many points (smooth boundary). $k=n$ predicts the overall majority everywhere." },
    { h: "The cost", t: "k-NN builds no model. It is <b>lazy</b> and <b>non-parametric</b>: all training data must be kept, and every prediction computes $n$ distances." },
    { h: "Judging it", t: "Because training error is misleading (each point is its own neighbour), we use <b>leave-one-out</b> cross-validation: predict each point from the others." },
    { h: "How it is tested", t: "Run the algorithm by hand on small data, say what $k$ does to smoothness and training error, count distance computations, do k-NN regression, and compute LOOCV error." }
  ],
  mind: {
    center: "k-NN",
    branches: [
      { n: "Distance", sec: "prereq", kids: ["Euclidean: square root of sum of squares", "Manhattan: sum of absolute gaps", "compare squared distances to rank"] },
      { n: "Algorithm", sec: "algo", kids: ["measure distance to all points", "take the k nearest", "majority vote", "ties: follow the rule given"] },
      { n: "Choosing k", sec: "kfit", kids: ["small k: wiggly, overfits", "large k: smooth, underfits", "k = 1: training error 0", "each point is its own neighbour"] },
      { n: "Properties", sec: "props", kids: ["lazy: no training step", "non-parametric", "keeps all training data", "n distances per prediction"] },
      { n: "Regression", sec: "reg", kids: ["average the k neighbour values", "staircase-shaped fit"] },
      { n: "LOOCV", sec: "loo", kids: ["leave one point out", "predict it from the others", "error = wrong ÷ n"] }
    ]
  },
  graph: {
    layers: [["dist"], ["nbr", "kk"], ["vote", "avg"], ["err"]],
    nodes: {
      dist: { t: "Distances", s: "new point to every training point" },
      nbr: { t: "k nearest", s: "the k smallest distances" },
      kk: { t: "Choice of k", s: "smooth versus wiggly" },
      vote: { t: "Majority vote", s: "classification" },
      avg: { t: "Average", s: "regression" },
      err: { t: "LOOCV error", s: "wrong predictions ÷ n" }
    },
    edges: [["dist", "nbr", "sort and take k"], ["kk", "nbr", "how many to take"], ["nbr", "vote", "class labels"], ["nbr", "avg", "numeric labels"], ["vote", "err", "count mistakes"], ["avg", "err", "check on held-out point"]]
  },
  secs: {
    prereq: {
      q: "What is 'distance', and how do I vote or average?",
      why: "k-NN is only distances plus a vote. Getting the distance arithmetic right is half of every k-NN question.",
      plain: "Distance is how far two points are apart. Euclidean is the straight-line distance; Manhattan adds up the gaps along each axis. To rank neighbours you can skip the square root and compare squared distances.",
      remember: ["Euclidean: $\\sqrt{\\sum_j(a_j-b_j)^2}$. Manhattan: $\\sum_j|a_j-b_j|$.", "Squared distances give the same neighbour order as distances, with no square root.", "Features on big scales dominate the distance, which is why we rescale.", "Classification: majority vote. Regression: average."]
    },
    algo: {
      q: "How do I run k-NN by hand on a small table?",
      why: "Most k-NN PYQs are exactly this: a small table, a new point, a value of $k$.",
      plain: "Write the distance from the new point to every row. Sort. Circle the $k$ smallest. Count the labels among them. The winner is the prediction.",
      remember: ["Always compute the distance to <b>all</b> $n$ points first.", "Pick the $k$ smallest, then vote. Do not vote before sorting.", "Ties in a vote or in distance: follow the rule stated in the question.", "$k$ is the number of neighbours, not the number of features."]
    },
    kfit: {
      q: "What does $k$ do to the boundary and to the training error?",
      why: "Choosing $k$ is the only real decision in k-NN, and several PYQs ask how it changes smoothness or training error.",
      plain: "Small $k$: the boundary follows every single point and wiggles around noise. Large $k$: many points vote, so the boundary becomes smooth, possibly too smooth. With $k=1$ a training point is its own nearest neighbour, so training error is zero.",
      remember: ["Small $k$ → complex, wiggly boundary, low bias, high variance (overfit).", "Large $k$ → smooth boundary, high bias, low variance (underfit).", "$k=1$ gives zero training error when no two identical points have different labels.", "Training error is not a fair way to pick $k$. Use validation or LOOCV."]
    },
    props: {
      q: "What kind of model is k-NN, and what does a prediction cost?",
      why: "True/false questions on 'lazy', 'parametric' and 'cost' show up repeatedly.",
      plain: "k-NN does no work at training time and keeps all the data. At prediction time it measures the distance to every stored point.",
      remember: ["Lazy: no explicit model is built during training.", "Non-parametric: no fixed set of fitted parameters, the data <i>is</i> the model.", "The training set is needed to predict.", "One prediction costs $n$ distances, independent of $k$ (about $n\\cdot d$ operations).", "k-NN is non-parametric: it fits no distribution, and the data itself is the model."]
    },
    reg: {
      q: "How does k-NN predict a number instead of a class?",
      why: "The same neighbour idea is used for regression, and it appears as its own PYQ type.",
      plain: "Find the $k$ nearest points exactly as before, but instead of voting, average their numeric labels.",
      remember: ["$\\hat y(x)=\\frac1k\\sum_{i\\in N_k(x)}y_i$.", "The fitted curve is a staircase: it changes only when the set of neighbours changes.", "Classification = vote, regression = average. Everything else is identical."]
    },
    loo: {
      q: "How do I measure how good k-NN really is?",
      why: "Training error is misleading for k-NN, so leave-one-out cross-validation is the standard fair test.",
      plain: "Remove one point, predict it from the remaining points, note whether you were right. Repeat for every point. The LOOCV error is the fraction you got wrong.",
      remember: ["LOOCV error = (number of wrong predictions) ÷ $n$.", "The left-out point is excluded from its own neighbours (unlike training error).", "Do one point at a time, writing its neighbours explicitly.", "With $k=n-1$ and two balanced classes, every left-out point sees the other class as the majority, so LOOCV is about 1."]
    },
    pyqs: {
      q: "Can I solve the k-NN questions asked before?",
      why: "They show the exact patterns: run the algorithm, effect of $k$, cost, regression and LOOCV.",
      plain: "Attempt on paper first, then compare your method (not only your answer) with the solution."
    }
  },
  end: {
    props: [
      ["Type of model", "Lazy, non-parametric, instance-based. No training step, all training data kept."],
      ["Cost of a prediction", "$n$ distance computations (about $n\\cdot d$ operations). Independent of $k$."],
      ["Small $k$", "Wiggly boundary, low bias, high variance. $k=1$ has zero training error."],
      ["Large $k$", "Smooth boundary, high bias, low variance. $k=n$ predicts the majority everywhere."],
      ["Classification", "Majority vote among the $k$ nearest."],
      ["Regression", "Average of the $k$ nearest values. Staircase fit."],
      ["LOOCV error", "Wrong predictions ÷ $n$, each point predicted from the others."],
      ["Feature scale", "Large-scale features dominate the distance, so rescale before using k-NN."]
    ],
    cues: [
      ["classify this new point with k = ...", "Distance to every point, sort, take $k$, vote."],
      ["training error of k-NN with k = 1", "Each point is its own neighbour, so zero (unless duplicates disagree)."],
      ["how many distance computations", "$n$ per prediction, regardless of $k$."],
      ["leave-one-out error", "Hide one point, predict it, count wrong, divide by $n$."],
      ["predict a number", "Average the $k$ neighbour values."],
      ["boundary becomes smoother", "Increase $k$."]
    ],
    traps: ["Treating $k$ as the number of features.", "Forgetting that a training point is its own neighbour in training error but not in LOOCV.", "Believing $k$ changes the number of distances computed.", "Voting before sorting by distance.", "Mixing up Euclidean and Manhattan distances.", "Saying k-NN builds a model during training."],
    hooks: ["Ask the neighbours.", "Small k wiggles, big k smooths.", "k = 1: every point is its own neighbour.", "Lazy: all the work is at prediction.", "n distances, always.", "Vote for classes, average for numbers.", "LOOCV: leave one out, predict it back."]
  }
};

window.GUIDE['cross-validation'] = {
  icon: '🔁', color: '#ca8a04',
  one: "Cross-validation answers one question: <b>how well will this model do on data it has never seen?</b> We hide part of the data, train on the rest, and measure on the hidden part.",
  story: [
    { h: "The problem", t: "Training error is a bad judge: a model can memorise the training points and still fail on new ones. We need an honest estimate of future performance, and a fair way to choose hyperparameters such as $\\lambda$, $k$ or depth." },
    { h: "The idea: three jobs for data", t: "<b>Training</b> data fits the model. <b>Validation</b> data chooses the hyperparameter. <b>Test</b> data is touched once at the end to report the final result." },
    { h: "k-fold cross-validation", t: "Split the data into $k$ equal folds. Train on $k-1$ folds, validate on the remaining one, and rotate so that every fold is validation once. Average the $k$ errors." },
    { h: "Leave-one-out (LOOCV)", t: "The extreme case $k=n$: each fold is a single point. It uses almost all the data for training, but needs $n$ models." },
    { h: "Choosing a hyperparameter", t: "For each candidate setting compute the validation error, then pick the setting with the <b>smallest validation error</b>, never the smallest training error." },
    { h: "How it is tested", t: "Read a table of training and validation errors and pick a setting, count models and set sizes in k-fold, do LOOCV for a line by hand, and decide which models can reach zero training error." }
  ],
  mind: {
    center: "Cross-validation",
    branches: [
      { n: "Why validate", sec: "tune", kids: ["training error is optimistic", "need an honest estimate", "choose hyperparameters"] },
      { n: "Three kinds of data", sec: "overview", kids: ["train: fit the model", "validation: choose settings", "test: final report, once"] },
      { n: "Reading error tables", sec: "tune", kids: ["training error keeps falling", "validation error is U-shaped", "pick smallest validation error"] },
      { n: "k-fold", sec: "cvproc", kids: ["k models per setting", "train size n(k−1)/k", "validation size n/k", "average the k errors"] },
      { n: "LOOCV for a line", sec: "loolr", kids: ["k = n", "n models, each on n−1 points", "refit the line each time"] },
      { n: "Zero training error", sec: "comp", kids: ["fully grown tree: yes", "1-NN: yes", "linear model: not always", "predict the mean: no"] }
    ]
  },
  graph: {
    layers: [["data"], ["split", "grid"], ["model", "verr"], ["pick"]],
    nodes: {
      data: { t: "All labelled data", s: "n points" },
      split: { t: "Split into folds", s: "k folds, or k = n" },
      grid: { t: "Candidate settings", s: "λ, k, depth ..." },
      model: { t: "Train on k−1 folds", s: "one model per fold" },
      verr: { t: "Validation error", s: "on the held-out fold" },
      pick: { t: "Best setting", s: "smallest validation error" }
    },
    edges: [["data", "split", "divide"], ["data", "grid", "try each"], ["split", "model", "rotate the held-out fold"], ["grid", "model", "fit each setting"], ["model", "verr", "score on unseen fold"], ["verr", "pick", "average, then compare"]]
  },
  secs: {
    prereq: {
      q: "What does it mean to fit a line, and what are the three kinds of data?",
      why: "LOOCV for a line is the one calculation-heavy part of this topic, and the three roles of data are the key idea.",
      plain: "Fitting $y=w_0+w_1x$ means choosing $w_1=S_{xy}/S_{xx}$ and $w_0=\\bar y-w_1\\bar x$. Training data fits, validation data chooses, test data reports.",
      remember: ["$w_1=S_{xy}/S_{xx}$ and $w_0=\\bar y-w_1\\bar x$, where $S$ are sums of centred products.", "Training data fits the model, validation data chooses hyperparameters, test data reports the final number once.", "Never choose a model by looking at the test data."]
    },
    tune: {
      q: "Given a table of training and validation errors, which setting do I choose?",
      why: "This is the most direct use of validation and a common PYQ pattern.",
      plain: "Ignore the training column when choosing. Look down the validation column and pick the row with the smallest value. A training error that keeps falling while validation error rises is overfitting.",
      remember: ["Choose the hyperparameter with the smallest <b>validation</b> error.", "Training error usually keeps decreasing as the model gets more complex.", "Validation error is typically U-shaped: too simple underfits, too complex overfits.", "Large gap between low training error and high validation error means overfitting."]
    },
    cvproc: {
      q: "How does k-fold work, and how many models and points are involved?",
      why: "Counting questions (how many models, how big is each set) are quick marks if you know the formulas.",
      plain: "Cut the data into $k$ equal folds. Each round holds one fold out for validation and trains on the other $k-1$. After $k$ rounds every point has been validated exactly once.",
      remember: ["$k$ models are trained per candidate setting.", "Training size $=n\\frac{k-1}{k}$, validation size $=\\frac nk$.", "Total models in a grid search $=(\\text{number of settings})\\times k$.", "Every point is used for validation exactly once and for training $k-1$ times."]
    },
    loolr: {
      q: "How do I do leave-one-out cross-validation for a line by hand?",
      why: "It is the heaviest calculation in the topic: 12 marks of PYQs for this concept.",
      plain: "Remove one point, fit the line to the remaining points, predict the removed point, record the squared error. Repeat for each point and average.",
      remember: ["LOOCV means $k=n$: $n$ models, each trained on $n-1$ points.", "Refit the line every time. Do not reuse the full-data line.", "Error for each left-out point = (actual − predicted) squared, then average over $n$.", "Write the remaining points and their $\\bar x,\\bar y$ before computing each fit."]
    },
    comp: {
      q: "Which models can reach zero training error, and what do their boundaries look like?",
      why: "True/false questions on this comparison keep appearing, and it links trees, k-NN, naive Bayes and linear models together.",
      plain: "A model reaches zero training error only if it is flexible enough to repeat every training label. A lookup rule, a fully grown tree and 1-NN can; a straight line or a vote among five neighbours cannot always.",
      remember: ["Guaranteed zero training error (distinct points): look-up rule, fully grown decision tree, 1-NN.", "Not guaranteed: $k$-NN with $k=5$, naive Bayes, a linear model, predicting the mean.", "Tree boundaries are axis-parallel; ridge and lasso are linear; 1-NN is piecewise non-linear.", "Depth of a tree is a hyperparameter chosen by cross-validation.", "k-NN is lazy and non-parametric, and its $k$ counts neighbours."]
    },
    pyqs: {
      q: "Can I solve the cross-validation questions asked before?",
      why: "They show the patterns: choose from a table, count folds, do LOOCV for a line, compare models.",
      plain: "Attempt each on paper, then compare your method with the solution."
    }
  },
  end: {
    props: [
      ["Training error", "Optimistic. It falls as the model gets more complex, so it cannot choose the model."],
      ["Validation error", "Used to choose hyperparameters. The smallest validation error wins."],
      ["Test error", "Used once at the end to report performance. Never used to choose."],
      ["k-fold", "$k$ models per setting, train size $n(k-1)/k$, validation size $n/k$."],
      ["LOOCV", "$k=n$: $n$ models, each trained on $n-1$ points."],
      ["Grid search", "Models trained = number of settings × $k$."],
      ["Zero training error", "Possible for a fully grown tree and 1-NN. Not guaranteed for a linear model or naive Bayes."]
    ],
    cues: [
      ["choose lambda / k / depth from a table", "Take the row with the smallest validation error."],
      ["how many models are trained in k-fold", "$k$ per setting, times the number of settings."],
      ["size of the training set in each fold", "$n(k-1)/k$."],
      ["leave-one-out for a line", "Refit the line $n$ times, each time on $n-1$ points."],
      ["can this model reach zero training error", "Ask: can it repeat every training label?"]
    ],
    traps: ["Choosing the setting with the smallest training error.", "Using the test set to choose a hyperparameter.", "Reusing the full-data line when computing LOOCV.", "Mixing up training size $n(k-1)/k$ and validation size $n/k$.", "Forgetting to multiply by the number of settings in a grid search."],
    hooks: ["Train fits, validation chooses, test reports.", "Smallest validation error wins.", "k-fold: k models, each trains on (k−1)/k of the data.", "LOOCV: k = n.", "Training error always flatters the model."]
  }
};
