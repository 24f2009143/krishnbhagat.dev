/* Guide data, part 2: Linear regression, Ridge/Lasso/MAP, Kernel regression, Naive Bayes. */
window.GUIDE = window.GUIDE || {};

window.GUIDE['linear-regression'] = {
  icon: '📈', color: '#2563eb',
  one: "Linear regression draws the <b>best straight line</b> (or flat plane) through your data, where 'best' means the smallest total squared error. The same answer can be reached by calculus, geometry, gradient descent or probability.",
  story: [
    { h: "The problem", t: "Predict a <b>number</b> (a price, a temperature) from features. The data points do not lie exactly on any line because of noise, so we need a rule for choosing the 'best' line." },
    { h: "The idea", t: "Predict $\\hat y=w^Tx$ and judge a choice of weights $w$ by the <b>squared loss</b> $L(w)=\\sum_i(w^Tx_i-y_i)^2=\\|X^Tw-y\\|^2$. Here $X$ is $d\\times n$: each column is one data point." },
    { h: "Road 1: calculus", t: "The loss is a bowl. At the bottom the slope is zero. Setting the gradient to zero gives the <b>normal equations</b> $XX^Tw=Xy$, so $w^*=(XX^T)^{-1}Xy$." },
    { h: "Road 2: geometry", t: "The predictions $X^Tw$ can only reach the flat space spanned by the feature columns. The best prediction is the <b>projection</b> of $y$ onto that space, and the leftover residual is perpendicular to it." },
    { h: "Road 3 and 4: gradient descent and probability", t: "<b>Gradient descent</b> walks downhill with step size $\\eta$ and reaches the same $w^*$. The <b>maximum-likelihood</b> view says: if labels are the line plus Gaussian noise, the most probable $w$ is again least squares." },
    { h: "How it is tested", t: "Compute $w^*$, read a fitted line from a picture, projections and spans (zero training error), which model lowers the training loss, one step of gradient descent and the learning rate, and what the noise variance changes (nothing for $\\hat w$)." }
  ],
  mind: {
    center: "Linear regression",
    branches: [
      { n: "Maths first", sec: "prereq", kids: ["X is d×n: columns are points", "residual = prediction − label", "slope shows the downhill direction"] },
      { n: "Model and loss", sec: "setup", kids: ["ŷ = wᵀx", "loss = Σ (wᵀxᵢ − yᵢ)²", "linear in w, not in x"] },
      { n: "Normal equations", sec: "normal", kids: ["XXᵀw = Xy", "w* = (XXᵀ)⁻¹Xy", "intercept: centre or append 1", "scaling y or x"] },
      { n: "Geometry", sec: "geom", kids: ["ŷ = projection of y", "residual ⟂ features", "zero error iff y in span"] },
      { n: "Model comparison", sec: "model", kids: ["bigger model: loss ≤", "training ≠ test", "nested models"] },
      { n: "Gradient descent", sec: "gd", kids: ["w ← w − η∇L", "∇L = 2X(Xᵀw − y)", "η too big: diverges", "SSE versus MSE"] },
      { n: "MLE view", sec: "mle", kids: ["Gaussian noise ⇒ least squares", "σ² does not change ŵ", "σ̂² = SSE ÷ n"] }
    ]
  },
  graph: {
    layers: [["data"], ["loss"], ["calc", "geo", "gd", "mle"], ["w"]],
    nodes: {
      data: { t: "Data X, y", s: "X is d×n" },
      loss: { t: "Squared loss", s: "‖Xᵀw − y‖²" },
      calc: { t: "Calculus", s: "gradient = 0" },
      geo: { t: "Geometry", s: "project y onto the span" },
      gd: { t: "Gradient descent", s: "walk downhill, step η" },
      mle: { t: "Probability", s: "Gaussian noise, max likelihood" },
      w: { t: "Best weights w*", s: "(XXᵀ)⁻¹ X y" }
    },
    edges: [["data", "loss", "choose a loss"], ["loss", "calc", "slope = 0"], ["loss", "geo", "nearest point"], ["loss", "gd", "step by step"], ["loss", "mle", "noise model"], ["calc", "w", "normal eqns"], ["geo", "w", "perpendicular"], ["gd", "w", "small η"], ["mle", "w", "same answer"]]
  },
  secs: {
    prereq: {
      q: "What vectors, matrices and slopes do I need first?",
      why: "The loss, the gradient and the geometry are all written with vectors and matrices, and slopes tell gradient descent which way is downhill.",
      plain: "A vector is a list of numbers. The data matrix $X$ has one column per data point. A residual is prediction minus label. The slope of a curve says which direction makes it go up.",
      remember: ["$X$ is $d\\times n$: columns are data points.", "Residual $=w^Tx_i-y_i$. The loss is the sum of squared residuals.", "Positive slope: the function rises to the right. To go down, step the opposite way.", "$\\nabla L$ points in the direction of fastest increase."]
    },
    setup: {
      q: "What is the model, what is the loss, and how do I read a fitted line from a picture?",
      why: "Everything else in the topic minimises this one loss, and PYQs ask you to read it from pictures.",
      plain: "The model predicts $\\hat y=w^Tx$. The loss adds up how far each prediction is from its label, squared so that over-shooting and under-shooting both count and big misses count extra.",
      remember: ["$L(w)=\\sum_i(w^Tx_i-y_i)^2=\\|X^Tw-y\\|^2$.", "'Linear' means linear in the weights $w$, not in $x$.", "Squared loss punishes big errors much more than small ones.", "A least-squares line balances its positive and negative residuals."]
    },
    normal: {
      q: "How do I find the best weights exactly?",
      why: "This is the central formula of the topic. This concept carries the most marks of all in your PYQs here.",
      plain: "At the bottom of a bowl-shaped loss the slope is zero. Setting the gradient to zero gives the normal equations $XX^Tw=Xy$, and we solve them for $w$.",
      remember: ["$XX^Tw=Xy$, so $w^*=(XX^T)^{-1}Xy$ when $XX^T$ is invertible.", "One feature, no intercept: $w^*=\\sum x_iy_i/\\sum x_i^2$.", "With an intercept: $w_1=\\sum(x_i-\\bar x)(y_i-\\bar y)/\\sum(x_i-\\bar x)^2$ and $w_0=\\bar y-w_1\\bar x$. The residuals then sum to 0.", "Scaling: $y\\to cy$ gives $w^*\\to cw^*$. $x\\to cx$ gives $w^*\\to w^*/c$.", "At the optimum, $X(X^Tw^*-y)=0$."]
    },
    geom: {
      q: "What is the geometric picture of least squares?",
      why: "Many true/false and conceptual PYQs are easiest from this picture: projection, perpendicular residual and span.",
      plain: "The predictions $X^Tw$ can only land in the flat space spanned by the feature columns. The best prediction is the point in that space nearest to $y$: the foot of the perpendicular. What is left over, the residual, sticks out at a right angle.",
      remember: ["$\\hat y=X^Tw^*$ is the projection of $y$ onto the span of the columns of $X^T$.", "The residual $y-X^Tw^*$ is perpendicular to every feature column.", "Zero training error happens exactly when $y$ already lies in that span.", "Pythagoras: $\\|y\\|^2=\\|X^Tw^*\\|^2+\\|y-X^Tw^*\\|^2$."]
    },
    model: {
      q: "Which model can reduce the training loss more?",
      why: "PYQs compare models (add a feature, change the loss) and ask what happens to the training loss.",
      plain: "If model A is a special case of model B, then B can do at least as well on the training data, because it can copy A. More flexibility never raises the best training loss, but it may hurt on new data.",
      remember: ["A bigger (nested) model has best training loss that is lower or equal.", "Lower training loss does not mean better predictions on new data.", "Zero training error can still give bad predictions.", "Compare models by checking whether one contains the other."]
    },
    gd: {
      q: "How do I reach the best weights without solving equations?",
      why: "Gradient descent is the engine behind most of machine learning, and its learning-rate behaviour is a favourite PYQ.",
      plain: "Stand on the loss bowl, look at the slope, take a small step downhill, and repeat. The learning rate $\\eta$ is the step size: too small is slow, too large overshoots.",
      remember: ["$w^{(t+1)}=w^{(t)}-\\eta\\nabla L(w^{(t)})$ with $\\nabla L=2X(X^Tw-y)$.", "If the loss has a $\\frac12$ in front, the $2$ disappears.", "One feature, plain sum loss: converges iff $0<\\eta<1/\\sum x_i^2$.", "Each step multiplies the distance to the optimum by $(1-2\\eta\\sum x_i^2)$.", "SSE sums the errors and MSE averages them: same minimiser, different gradient size."]
    },
    mle: {
      q: "Why is least squares the 'right' loss?",
      why: "It connects regression to probability, and PYQs ask what changes (and what does not) when the noise variance changes.",
      plain: "Assume each label is the true line plus bell-shaped (Gaussian) noise. The weights that make the observed labels most probable are exactly the least-squares weights.",
      remember: ["Gaussian noise plus maximum likelihood gives least squares.", "The noise variance $\\sigma^2$ does <b>not</b> change $\\hat w$.", "$\\hat\\sigma^2_{ML}=\\text{SSE}/n$: divide by $n$ (not $n-1$) and fit $w$ first.", "The negative log-likelihood is a constant plus $\\frac1{2\\sigma^2}\\sum(y_i-w^Tx_i)^2$."]
    },
    pyqs: {
      q: "Can I solve the linear-regression questions asked before?",
      why: "They show the exact patterns that are tested: compute $w^*$, geometry, model comparison, gradient descent, MLE.",
      plain: "Attempt each on paper first, then compare your method with the solution."
    }
  },
  end: {
    props: [
      ["Loss", "$L(w)=\\|X^Tw-y\\|^2$: smooth, bowl-shaped, one minimum."],
      ["Optimal weights", "Normal equations $XX^Tw=Xy$."],
      ["Geometry", "Fit = projection of $y$ onto the span of the features. Residual is perpendicular to it."],
      ["Intercept", "Add a column of ones or centre the data. Residuals then sum to zero."],
      ["Scaling", "$y\\to cy$: $w^*\\to cw^*$. $x\\to cx$: $w^*\\to w^*/c$."],
      ["Training error", "Zero exactly when $y$ lies in the span of the features."],
      ["Gradient descent", "Needs a small enough learning rate. Same minimiser as the exact solution."],
      ["Probabilistic view", "Gaussian noise gives least squares. $\\sigma^2$ does not change $\\hat w$."]
    ],
    cues: [
      ["find the optimal weight / best-fit line", "Normal equations or the one-feature formula."],
      ["after one step of gradient descent", "$w-\\eta\\cdot2X(X^Tw-y)$. Check whether the loss has a $\\frac12$."],
      ["can the training error be zero", "Is $y$ in the span of the feature columns?"],
      ["if we scale / duplicate / add points", "Use the scaling facts and check what stays the same."],
      ["noise variance is changed", "$\\hat w$ is unchanged. Only $\\hat\\sigma^2$ changes."],
      ["which model has lower training loss", "Is one model a special case of the other?"]
    ],
    traps: ["Forgetting the factor $2$ in the gradient (or the $\\frac12$ in the loss).", "Mixing up $XX^T$ and $X^TX$: remember $X$ is $d\\times n$.", "Thinking $\\sigma^2$ changes $\\hat w$.", "Thinking 'linear' means linear in $x$.", "Believing lower training loss means better predictions.", "Using a learning rate that is too large and diverging."],
    hooks: ["Columns of $X$ are data points.", "Gradient zero gives the normal equations.", "Fit equals projection; residual is perpendicular.", "More features: training loss never goes up.", "$\\eta$ too big: it bounces away.", "Gaussian noise plus likelihood is least squares."]
  }
};

window.GUIDE['ridge-lasso-map'] = {
  icon: '🧲', color: '#7c3aed',
  one: "Regularisation adds a <b>price on large weights</b> so a model cannot chase noise. Ridge charges for the squared size, Lasso for the absolute size, and MAP shows both are just 'least squares plus a prior belief about $w$'.",
  story: [
    { h: "The problem", t: "Plain least squares can behave badly: with few points, many features or noisy labels it produces <b>huge weights</b> that follow the noise and predict poorly on new data." },
    { h: "Idea 1: Ridge", t: "Add a penalty for large weights: $L_R(w)=\\|X^Tw-y\\|^2+\\lambda\\|w\\|^2$. The solution $\\hat w_R=(XX^T+\\lambda I)^{-1}Xy$ always exists when $\\lambda>0$. Bigger $\\lambda$ shrinks the weights more." },
    { h: "Idea 2: the constrained view", t: "The same family of answers appears as 'minimise the error <b>subject to</b> $\\|w\\|^2\\le\\theta$'. A bigger penalty $\\lambda$ corresponds to a tighter limit $\\theta$. This is how the PYQs ask you to pick a weight vector." },
    { h: "Idea 3: Lasso", t: "Penalise the sum of absolute values, $\\lambda\\|w\\|_1$. The $L_1$ ball is a diamond with corners on the axes, so the best point often sits on a corner and <b>some weights become exactly zero</b>." },
    { h: "Idea 4: MAP, the probability view", t: "Treat $w$ as uncertain with a prior belief. A Gaussian prior gives ridge with $\\lambda=\\sigma^2/\\gamma^2$. A Laplace prior gives lasso. Ordinary least squares is the case of no prior." },
    { h: "How it is tested", t: "Ridge arithmetic ($1\\times1$ and $2\\times2$), what $\\lambda$ does, choosing the weight vector under a norm constraint, reading Lasso contour pictures, and deriving $\\lambda$ from a prior." }
  ],
  mind: {
    center: "Ridge, Lasso, MAP",
    branches: [
      { n: "Why regularise", sec: "overview", kids: ["huge weights fit noise", "penalty = price on size", "less variance, more bias"] },
      { n: "Pieces you need", sec: "prereq", kids: ["norms ‖w‖², ‖w‖₁", "2×2 matrix inverse", "Bayes rule on w", "Gaussian and Laplace shapes"] },
      { n: "Ridge", sec: "ridge", kids: ["SSE + λ‖w‖²", "(XXᵀ + λI)⁻¹ Xy", "λ = 0: plain least squares", "λ → ∞: w → 0", "always invertible if λ > 0"] },
      { n: "Constrained form", sec: "constr", kids: ["min SSE s.t. ‖w‖² ≤ θ", "filter by norm, then best error", "bigger λ, smaller θ"] },
      { n: "Lasso", sec: "lasso", kids: ["SSE + λ‖w‖₁", "diamond has corners", "exact zeros: sparsity", "feature selection"] },
      { n: "MAP", sec: "map", kids: ["likelihood × prior", "Gaussian prior → ridge", "Laplace prior → lasso", "λ = σ² ÷ γ²"] }
    ]
  },
  graph: {
    layers: [["mle"], ["pen", "prior"], ["ridge", "lasso"], ["lam"]],
    nodes: {
      mle: { t: "Least squares", s: "SSE only, maximum likelihood" },
      pen: { t: "Add a penalty", s: "price on big weights" },
      prior: { t: "Add a prior", s: "belief about w (MAP)" },
      ridge: { t: "Ridge", s: "λ‖w‖², shrinks smoothly" },
      lasso: { t: "Lasso", s: "λ‖w‖₁, exact zeros" },
      lam: { t: "Choose λ", s: "by validation error" }
    },
    edges: [["mle", "pen", "overfits noise"], ["mle", "prior", "ignores prior belief"], ["pen", "ridge", "squared size, L2"], ["pen", "lasso", "absolute size, L1"], ["prior", "ridge", "Gaussian prior"], ["prior", "lasso", "Laplace prior"], ["ridge", "lam", "tune"], ["lasso", "lam", "tune"]]
  },
  secs: {
    prereq: {
      q: "What small tools do I need before ridge, lasso and MAP?",
      why: "The formulas use norms, a $2\\times2$ inverse and Bayes' rule. These are quick to learn and every PYQ arithmetic step uses them.",
      plain: "A norm is a way of measuring the size of a vector: square-and-add for $L_2$, absolute-value-and-add for $L_1$. A $2\\times2$ inverse is: swap the diagonal, negate the others, divide by the determinant.",
      remember: ["$\\|w\\|^2=\\sum w_j^2$ and $\\|w\\|_1=\\sum|w_j|$.", "$\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}^{-1}=\\frac1{ad-bc}\\begin{bmatrix}d&-b\\\\-c&a\\end{bmatrix}$.", "Bayes: posterior $\\propto$ likelihood $\\times$ prior.", "Gaussian prior is bell-shaped (smooth); Laplace prior has a sharp peak at 0."]
    },
    ridge: {
      q: "How do I compute the ridge solution and what does $\\lambda$ do?",
      why: "Ridge arithmetic and the role of $\\lambda$ carry the most marks of all in your PYQs for this topic.",
      plain: "Ridge is least squares plus a spring pulling every weight toward $0$. The strength of the spring is $\\lambda$. Mathematically it just adds $\\lambda$ to the diagonal of $XX^T$ before inverting.",
      remember: ["$L_R(w)=\\|X^Tw-y\\|^2+\\lambda\\|w\\|^2$ and $\\hat w_R=(XX^T+\\lambda I)^{-1}Xy$.", "For $\\lambda>0$, $XX^T+\\lambda I$ is always invertible, so $\\hat w_R$ always exists.", "One feature: $\\hat w_R/\\hat w_{MLE}=\\sum x_i^2/(\\sum x_i^2+\\lambda)$. The label vector $y$ cancels.", "$\\lambda=0$ gives plain least squares; large $\\lambda$ shrinks strongly (risk of underfitting); $\\lambda\\to\\infty$ gives $w\\to0$.", "If many $w$ give the same minimal error, ridge picks the one with the smallest norm."]
    },
    constr: {
      q: "How do I choose the winning weight vector when there is a norm limit?",
      why: "The constrained form is how the PYQs ask you to 'select' a weight vector from a list of candidates.",
      plain: "Imagine a fence around the origin of radius $\\sqrt\\theta$. Weight vectors outside the fence are not allowed. Among those inside, you want the one with the smallest error.",
      remember: ["Constrained ridge: $\\min\\|X^Tw-y\\|^2$ subject to $\\|w\\|^2\\le\\theta$.", "Procedure: discard candidates that break the norm limit, then take the smallest error among the rest.", "A larger $\\lambda$ corresponds to a smaller $\\theta$ (a tighter limit).", "Penalty form and constraint form describe the same family of solutions."]
    },
    lasso: {
      q: "Why does Lasso give exact zeros, and how do I read its pictures?",
      why: "Lasso questions (7 PYQs) ask you to read contour figures, pick which weight vector is which and name the advantage of $L_1$.",
      plain: "The set of weights with a fixed $L_1$ size is a diamond. The error contours are ellipses growing from the unconstrained best point. They usually first touch the diamond at a corner, and corners sit on the axes, where some weights are exactly zero.",
      remember: ["Lasso loss: SSE $+\\lambda\\|w\\|_1$.", "The $L_1$ ball is a diamond; its corners lie on the axes, so the optimum often has some weights exactly $0$.", "Lasso is sparse (built-in feature selection). Ridge shrinks all weights but rarely makes one exactly $0$.", "One feature: ridge scales the weight down; lasso subtracts an amount and clips at $0$.", "Total loss at the optimum $=$ the error term plus $\\lambda\\|w\\|_1$ at that $w$."]
    },
    map: {
      q: "Why are ridge and lasso really 'least squares plus a prior'?",
      why: "MAP gives the meaning of $\\lambda$ and appears in 19 marks of PYQs: derive $\\lambda$ from a prior and say when MAP beats MLE.",
      plain: "Before seeing data you already believe weights are probably small. MAP combines that belief (the prior) with the data (the likelihood). Taking the negative log turns the product into a sum: error plus penalty.",
      remember: ["MAP maximises likelihood $\\times$ prior, i.e. posterior $\\propto P(y|X,w)P(w)$.", "Gaussian prior (variance $\\gamma^2$) with Gaussian noise (variance $\\sigma^2$) gives ridge with $\\lambda=\\sigma^2/\\gamma^2$.", "Laplace prior gives the $L_1$ penalty, i.e. lasso.", "MLE is the case with no prior (no regularisation).", "With plenty of data the likelihood dominates and MAP moves toward MLE.", "Check the convention in the question: where a $\\frac12$ appears changes what number $\\lambda$ equals."]
    },
    pyqs: {
      q: "Can I solve the ridge, lasso and MAP questions asked before?",
      why: "They show the exact patterns: ridge arithmetic, candidate selection, contour reading, deriving $\\lambda$.",
      plain: "Attempt each on paper first, then compare your method with the solution."
    }
  },
  end: {
    props: [
      ["Ridge", "SSE $+\\lambda\\|w\\|^2$. Shrinks all weights smoothly. Always has a unique solution for $\\lambda>0$."],
      ["Lasso", "SSE $+\\lambda\\|w\\|_1$. Produces exact zeros (sparse, feature selection)."],
      ["Effect of $\\lambda$", "$0$: plain least squares. Large: strong shrinkage, underfitting. $\\infty$: $w=0$."],
      ["Constrained form", "Penalty $\\lambda$ and limit $\\theta$ are linked: bigger $\\lambda$, smaller $\\theta$."],
      ["Geometry", "Ridge ball is a circle (no corners). Lasso ball is a diamond (corners on the axes)."],
      ["MAP", "Likelihood $\\times$ prior. Gaussian prior gives ridge, Laplace prior gives lasso."],
      ["MLE versus MAP", "MLE is MAP with no prior. MAP helps when data is scarce or noisy."]
    ],
    cues: [
      ["compute the ridge weight", "$(XX^T+\\lambda I)^{-1}Xy$. One feature: divide by $\\sum x^2+\\lambda$."],
      ["ratio of ridge to MLE weights", "One feature: $\\sum x^2/(\\sum x^2+\\lambda)$. $y$ cancels."],
      ["which weight vector is selected (constraint)", "Remove those with $\\|w\\|^2>\\theta$, then take the smallest error."],
      ["which one is lasso / sparsity / feature selection", "The solution with exact zeros."],
      ["derive lambda from a prior", "Gaussian prior and noise: $\\lambda=\\sigma^2/\\gamma^2$."],
      ["loss at the optimum for lasso", "Error plus $\\lambda\\|w\\|_1$, both at the optimum."]
    ],
    traps: ["Forgetting that the penalty is on $w$, not on the data.", "Forgetting to add $\\lambda$ to the diagonal only.", "Believing ridge produces exact zeros.", "Mixing up which of $\\gamma^2$ and $\\sigma^2$ goes on top in $\\lambda=\\sigma^2/\\gamma^2$.", "Ignoring a stated $\\frac12$ convention.", "Using the penalty in the 'error' that you compare across candidates."],
    hooks: ["Ridge: add $\\lambda$ to the diagonal.", "Circle shrinks, diamond zeroes.", "Big $\\lambda$: small weights, maybe underfit.", "Big $\\lambda$ means small $\\theta$.", "Gaussian prior is ridge; Laplace prior is lasso.", "$\\lambda=\\sigma^2/\\gamma^2$: noise over prior spread."]
  }
};

window.GUIDE['kernel-regression'] = {
  icon: '🌀', color: '#0d9488',
  one: "Kernel regression lets a <b>linear</b> method fit <b>curved</b> data by working with similarities between points, without ever building the huge feature vectors.",
  story: [
    { h: "The problem", t: "A straight line cannot fit curved data. We could describe each point with extra features $\\phi(x)$ (squares, products, ...), but the list of features explodes quickly." },
    { h: "The idea: the kernel trick", t: "A <b>kernel</b> $k(x,x')=\\phi(x)^T\\phi(x')$ returns the dot product in the lifted space directly. A common one is the polynomial kernel $(x^Tx'+c)^p$. We never write $\\phi$ out." },
    { h: "Step 1: the kernel matrix", t: "Fill an $n\\times n$ table $K$ with $K_{ij}=k(x_i,x_j)$. It is symmetric and positive semi-definite." },
    { h: "Step 2: solve for $\\alpha$", t: "Solve $K\\alpha=y$, so $\\alpha=K^{-1}y$ (needs $K$ invertible). Each $\\alpha_i$ says how much training point $i$ contributes." },
    { h: "Step 3: predict", t: "For a new point $x$, $\\hat y(x)=\\sum_i\\alpha_i\\,k(x_i,x)$. Every training point is used, so the model is <b>non-parametric</b>." },
    { h: "How it is tested", t: "Build $K$ for tiny data, solve a $2\\times2$ or $3\\times3$ system for $\\alpha$, compute predictions (14.5 marks of PYQs), and say whether it is parametric and what it costs." }
  ],
  mind: {
    center: "Kernel regression",
    branches: [
      { n: "Maths first", sec: "prereq", kids: ["inner product xᵀx′", "expand (a + b)²", "solve a linear system"] },
      { n: "Kernel idea", sec: "kdef", kids: ["φ lifts data to a richer space", "k(x, x′) = φ(x)ᵀφ(x′)", "polynomial (xᵀx′ + c)^p", "φ never built"] },
      { n: "Kernel matrix and α", sec: "kmat", kids: ["Kᵢⱼ = k(xᵢ, xⱼ)", "n×n, symmetric, PSD", "Kα = y, so α = K⁻¹y", "needs K invertible"] },
      { n: "Predictions", sec: "kpred", kids: ["ŷ(x) = Σ αᵢ k(xᵢ, x)", "every training point counts", "zero vector: c^p Σ αᵢ"] },
      { n: "Properties", sec: "kprop", kids: ["non-parametric", "needs all training points", "K invertible: train error 0"] }
    ]
  },
  graph: {
    layers: [["x"], ["kern", "phi"], ["K"], ["alpha", "pred"]],
    nodes: {
      x: { t: "Training points", s: "x₁ ... xₙ and labels y" },
      kern: { t: "Kernel k(x, x′)", s: "similarity of two points" },
      phi: { t: "Feature map φ", s: "lifted space, never built" },
      K: { t: "Kernel matrix K", s: "n×n, Kᵢⱼ = k(xᵢ, xⱼ)" },
      alpha: { t: "Coefficients α", s: "solve Kα = y" },
      pred: { t: "Prediction", s: "ŷ(x) = Σ αᵢ k(xᵢ, x)" }
    },
    edges: [["x", "kern", "compare pairs"], ["x", "phi", "idea only"], ["phi", "kern", "dot product after lifting"], ["kern", "K", "all pairs"], ["K", "alpha", "solve the system"], ["alpha", "pred", "weights on training points"]]
  },
  secs: {
    prereq: {
      q: "What small tools do I need before kernels?",
      why: "Every kernel question is built from an inner product, an expanded square and a small linear system.",
      plain: "An inner product multiplies matching entries and adds. A polynomial kernel is a bracket raised to a power, so you will expand brackets. Finding $\\alpha$ means solving a small system of equations.",
      remember: ["Inner product $x^Tx'=\\sum_jx_jx'_j$.", "$(a+b)^2=a^2+2ab+b^2$.", "Solve $K\\alpha=y$ by elimination, then substitute back to check."]
    },
    kdef: {
      q: "How can a straight-line method fit curves, and what is a kernel?",
      why: "Everything later (the matrix, $\\alpha$, predictions) rests on this single idea.",
      plain: "Instead of fitting a line to $x$, fit a line to a richer description $\\phi(x)$ (for example $x$ and $x^2$). A kernel is a shortcut: it hands you the dot product of two such descriptions directly, so you never write $\\phi$ out.",
      remember: ["$k(x,x')=\\phi(x)^T\\phi(x')$ is a similarity score.", "Polynomial kernel: $k(x,x')=(x^Tx'+c)^p$: dot product, add $c$, raise to $p$.", "The lifted space can be huge, $\\dim\\phi=\\binom{d+p}{p}$, which is why computing $k$ directly is cheaper.", "A kernel changes how similarity is measured, not the data itself."]
    },
    kmat: {
      q: "How do I build the kernel matrix and solve for $\\alpha$?",
      why: "You cannot predict without $\\alpha$, and tiny $K$-matrix systems are a standard PYQ task.",
      plain: "Fill an $n\\times n$ table where entry $(i,j)$ is the kernel between training points $i$ and $j$. Then solve $K\\alpha=y$: $\\alpha$ tells how much each training point contributes.",
      remember: ["$K_{ij}=k(x_i,x_j)$. $K$ is $n\\times n$, symmetric and positive semi-definite.", "$\\alpha=K^{-1}y$, which needs $K$ to be invertible.", "If $K$ is invertible, the model reproduces every training label: $\\hat y(x_j)=y_j$.", "Fill the matrix entry by entry, then check symmetry before solving."]
    },
    kpred: {
      q: "Given $\\alpha$, how do I compute a prediction for a new point?",
      why: "Predictions carry the most marks (14.5) in your PYQs for this topic.",
      plain: "Compute the kernel between the new point and each training point, multiply each by its $\\alpha$, and add everything up.",
      remember: ["$\\hat y(x)=\\sum_i\\alpha_i\\,k(x_i,x)$.", "Every training point contributes, weighted by $\\alpha_i$.", "Zero test vector with the polynomial kernel: every kernel value is $c^p$, so $\\hat y(0)=c^p\\sum_i\\alpha_i$.", "Make a small table of $k(x_i,x)$ values first, then multiply and add."]
    },
    kprop: {
      q: "Is kernel regression parametric, and what does it cost?",
      why: "The parametric / non-parametric label and the cost comparison are quick true/false marks.",
      plain: "A parametric model squeezes the data into a fixed set of numbers. Kernel regression keeps one coefficient per training point, so its size grows with the data: it is non-parametric.",
      remember: ["Non-parametric: the number of coefficients grows with $n$.", "Prediction needs all training points.", "Training builds and solves with an $n\\times n$ matrix.", "Linear regression on fixed features is parametric: a weight vector of fixed length."]
    },
    pyqs: {
      q: "Can I solve the kernel questions asked before?",
      why: "They show the patterns: kernel values, $K$ and $\\alpha$, predictions, parametric versus not.",
      plain: "Attempt each on paper first, then compare your method with the solution."
    }
  },
  end: {
    props: [
      ["Kernel", "$k(x,x')=\\phi(x)^T\\phi(x')$: the dot product after lifting, computed directly."],
      ["Polynomial kernel", "$(x^Tx'+c)^p$. Lifted dimension $\\binom{d+p}{p}$."],
      ["Kernel matrix", "$n\\times n$, symmetric, positive semi-definite."],
      ["Coefficients", "$\\alpha=K^{-1}y$ (needs $K$ invertible)."],
      ["Prediction", "$\\hat y(x)=\\sum_i\\alpha_ik(x_i,x)$. Uses every training point."],
      ["Training error", "Zero if $K$ is invertible: $K\\alpha=y$."],
      ["Type of model", "Non-parametric: coefficients grow with $n$."]
    ],
    cues: [
      ["compute the kernel matrix", "Entry $(i,j)=k(x_i,x_j)$. Check symmetry."],
      ["find alpha", "Solve $K\\alpha=y$ by elimination."],
      ["predict at a new point", "$\\sum\\alpha_ik(x_i,x)$."],
      ["predict at the zero vector", "$c^p\\sum\\alpha_i$ for the polynomial kernel."],
      ["parametric or not", "Does the size of the model grow with $n$? Then non-parametric."]
    ],
    traps: ["Forgetting to add $c$ before raising to the power $p$.", "Using $K^{-1}$ when $K$ is singular.", "Forgetting that prediction uses all training points.", "Mixing up the order of arguments: it is $k(x_i,x)$ for the training point and the new point.", "Calling kernel regression parametric."],
    hooks: ["Kernel = dot product after lifting.", "$K$ is $n\\times n$ and symmetric.", "$\\alpha=K^{-1}y$.", "Prediction = weighted sum of kernel values.", "Zero point: $c^p$ times the sum of $\\alpha$.", "One coefficient per point: non-parametric."]
  }
};

window.GUIDE['naive-bayes'] = {
  icon: '🎲', color: '#db2777',
  one: "Naive Bayes classifies by asking <b>which class most likely produced these features</b>, using Bayes' rule plus one simplifying ('naive') assumption that makes the model cheap to learn.",
  story: [
    { h: "The problem", t: "Predict a class $y$ from features $x$, for example spam from the words in an email." },
    { h: "The generative idea", t: "Model how each class produces features: learn $P(y)$ and $P(x|y)$. Then use <b>Bayes' rule</b> to flip it: $P(y|x)\\propto P(y)\\,P(x|y)$. The class with the largest score wins." },
    { h: "The trouble", t: "Writing down $P(x|y)$ for all feature combinations needs $K\\cdot2^d-1$ numbers for $K$ classes and $d$ binary features. That explodes." },
    { h: "The naive assumption", t: "Pretend the features are <b>independent given the class</b>: $P(x|y)=\\prod_jP(x_j|y)$. Now we need only $(K-1)+Kd$ numbers." },
    { h: "Learning by counting", t: "Each probability is a fraction from the data: the prior is $n_y/n$ and a feature probability is $k_{jy}/n_y$. A zero count would wipe out a class, so we use <b>Laplace smoothing</b>: $(k+1)/(n_y+2)$." },
    { h: "Real-valued features", t: "Use a bell curve per class and feature (<b>Gaussian Naive Bayes</b>), with that class's mean and variance. A density is a height, not a probability." },
    { h: "How it is tested", t: "Posterior from a joint table, counting parameters, estimating by counting (the largest block of marks), computing scores and posteriors, smoothing, and Gaussian features." }
  ],
  mind: {
    center: "Naive Bayes",
    branches: [
      { n: "Maths first", sec: "prereq", kids: ["P(A|B) = P(A,B) ÷ P(B)", "product rule", "independence", "Bayes' rule"] },
      { n: "Generative vs discriminative", sec: "gen", kids: ["generative: P(y) and P(x|y)", "discriminative: P(y|x) directly"] },
      { n: "Bayes classifier", sec: "bayes", kids: ["posterior = joint ÷ sum of joints", "P(x) cancels", "predict the larger score", "tie rule is given"] },
      { n: "Counting parameters", sec: "params", kids: ["full joint: K·2^d − 1", "naive: (K−1) + K·d", "Gaussian: mean + variance", "shared variance counted once"] },
      { n: "Naive assumption", sec: "nbmodel", kids: ["independent given the class", "P(x|y) = Π P(xⱼ|y)", "match model to feature type"] },
      { n: "Estimation", sec: "est", kids: ["prior = n_y ÷ n", "p̂ = k_jy ÷ n_y", "count within the class"] },
      { n: "Prediction", sec: "pred", kids: ["score = P(y) Π P(xⱼ|y)", "largest score wins", "posterior = score ÷ total"] },
      { n: "Smoothing and Gaussian", sec: "smooth", kids: ["(k+1) ÷ (n_y+2) removes zeros", "Gaussian: μ̂ and σ̂² per class", "density = height, not probability"] }
    ]
  },
  graph: {
    layers: [["gen"], ["bayes"], ["naive"], ["count", "smooth", "pred"]],
    nodes: {
      gen: { t: "Generative idea", s: "model P(y) and P(x | y)" },
      bayes: { t: "Bayes' rule", s: "P(y | x) ∝ P(y) P(x | y)" },
      naive: { t: "Naive assumption", s: "features independent given y" },
      count: { t: "Estimate by counting", s: "p̂ = k ÷ n_y" },
      smooth: { t: "Laplace smoothing", s: "no zero probabilities" },
      pred: { t: "Prediction", s: "largest P(y) Π P(xⱼ | y)" }
    },
    edges: [["gen", "bayes", "flip to get the posterior"], ["bayes", "naive", "too many numbers otherwise"], ["naive", "count", "few numbers, just count"], ["count", "smooth", "zero counts"], ["smooth", "pred", "safe estimates"]]
  },
  secs: {
    prereq: {
      q: "What probability do I need before Naive Bayes?",
      why: "Bayes' rule, the product rule and independence are the whole mathematical engine of this topic.",
      plain: "Probability is a fraction of all the cases. Conditional probability shrinks the world to the cases where $B$ happened. Independent means knowing one tells you nothing about the other.",
      remember: ["$P(A|B)=P(A,B)/P(B)$.", "Product rule: $P(A,B)=P(B)P(A|B)=P(A)P(B|A)$.", "Bayes: $P(y|x)=P(x|y)P(y)/P(x)$.", "Independence: $P(A,B)=P(A)P(B)$. Conditional independence is the same, given a class.", "$X$ is $(d,n)$: columns are data points."]
    },
    gen: {
      q: "What does 'generative' mean compared with 'discriminative'?",
      why: "This definition is a standard short PYQ and it explains why Naive Bayes is built the way it is.",
      plain: "A generative model tells a story of how the data was produced: first pick a class, then produce features for that class. A discriminative model skips the story and learns the boundary or $P(y|x)$ directly.",
      remember: ["Generative: learns $P(y)$ and $P(x|y)$ (the joint), then classifies with Bayes' rule.", "Discriminative: learns $P(y|x)$ or the boundary directly.", "Naive Bayes is generative."]
    },
    bayes: {
      q: "How do I find the most probable class when the probabilities are known?",
      why: "This is the base case behind everything else, and 10 marks of PYQs ask it directly.",
      plain: "Compute $P(\\text{class})\\times P(\\text{features}\\mid\\text{class})$ for each class and pick the largest. The denominator $P(x)$ is the same for every class, so it cancels when comparing.",
      remember: ["$P(c|x)=P(x,c)/\\sum_{c'}P(x,c')$.", "Binary rule: predict 1 iff $P(y{=}1)P(x|1)\\ge P(y{=}0)P(x|0)$. The tie rule is given in the question.", "$P(x)$ cancels when comparing classes.", "With uniform or Gaussian class densities, compare densities times priors.", "Bayes error is how often even the best rule is wrong."]
    },
    params: {
      q: "How many numbers must the model learn?",
      why: "Parameter counting is worth 20 marks of PYQs and is mostly quick arithmetic.",
      plain: "A parameter is one free number the model has to learn. Count class by class and feature by feature, subtracting 1 where probabilities must add up to 1.",
      remember: ["Full joint: $K\\cdot2^d-1$ ($K$ classes, $d$ binary features).", "Naive Bayes, binary features: $(K-1)+Kd$.", "A Gaussian feature in a class has two numbers: mean and variance.", "If the question says the variances are equal, count that variance once.", "Probabilities that must sum to 1 lose one free number."]
    },
    nbmodel: {
      q: "What exactly is the 'naive' assumption?",
      why: "It is the single idea that turns an impossible model into a tiny one.",
      plain: "We pretend the features do not influence each other once we know the class. It is rarely perfectly true, but it makes the model small and fast.",
      remember: ["$P(x|y)=\\prod_{j=1}^dP(x_j|y)$.", "Independence is <b>given the class</b>, not unconditional.", "Match the model to the feature type: Bernoulli for binary, categorical for categories, Gaussian for real numbers."]
    },
    est: {
      q: "How do I estimate the probabilities from a table of data?",
      why: "Estimation is the biggest block of marks in this topic: 24 marks of PYQs.",
      plain: "By counting. The prior is the fraction of points in the class. Each feature probability is the fraction of that class's points that have that feature value.",
      remember: ["Prior: $\\hat p=n_1/n$, the class proportion.", "Feature given class: $\\hat p_j^{\\,y}=k_{jy}/n_y$, where $k_{jy}$ counts class-$y$ points with feature $j$ equal to 1.", "Count within the class, so the denominator is the class size $n_y$, not $n$.", "If points carry weights, add the weights instead of counting."]
    },
    pred: {
      q: "How do I predict the class (and its probability) for a new point?",
      why: "Prediction questions carry 18 marks in your PYQs and combine estimation with the naive formula.",
      plain: "For each class multiply the prior by the probability of each observed feature value. The largest score wins. Divide a score by the sum of all scores to get a posterior probability.",
      remember: ["Score of class $y$: $P(y)\\prod_jP(x_j|y)$.", "For a binary feature use $\\hat p$ if the value is 1 and $1-\\hat p$ if it is 0.", "Predict the class with the largest score.", "Posterior = score ÷ sum of all class scores."]
    },
    smooth: {
      q: "What happens when a count is zero?",
      why: "A zero count would make a whole product zero and rule a class out forever, so smoothing is a standard fix and a regular PYQ.",
      plain: "A single unseen combination makes the product zero. Laplace smoothing pretends we saw every value once more than we did.",
      remember: ["Binary feature: $\\hat p=(k+1)/(n_y+2)$.", "$m$ possible values: $(k+1)/(n_y+m)$. With strength $\\alpha$: $(k+\\alpha)/(n_y+m\\alpha)$.", "Smoothing removes impossible zeros and pulls estimates toward uniform.", "Read whether the question wants the plain or the smoothed estimate."]
    },
    gauss: {
      q: "How does Naive Bayes handle real-valued features?",
      why: "Real data has numbers, and mixed binary and Gaussian features are a PYQ pattern.",
      plain: "Model each real feature in each class with a bell curve using that class's own mean and variance. A density is the height of the curve, not a probability.",
      remember: ["$\\hat\\mu=\\frac1{n_c}\\sum x$ and $\\hat\\sigma^2=\\frac1{n_c}\\sum(x-\\hat\\mu)^2$, per class and per feature.", "Divide by $n_c$, not $n_c-1$.", "$N(\\mu,\\sigma^2)$: the second number is the variance, not the standard deviation.", "A density can be larger than 1 because it is a height.", "Mixed features: multiply Bernoulli terms for binary features and Gaussian densities for real ones."]
    },
    pyqs: {
      q: "Can I solve the Naive Bayes questions asked before?",
      why: "With 37 PYQs this is the biggest topic. They show the patterns: posterior from a table, counting parameters, estimation, prediction, smoothing.",
      plain: "Attempt each on paper first, then compare your method with the solution."
    }
  },
  end: {
    props: [
      ["Generative model", "Learns $P(y)$ and $P(x|y)$, then uses Bayes' rule."],
      ["Naive assumption", "Features independent given the class: $P(x|y)=\\prod_jP(x_j|y)$."],
      ["Parameters", "Full joint $K2^d-1$. Naive Bayes (binary) $(K-1)+Kd$. Gaussian: mean and variance per class and feature."],
      ["Estimation", "Counting: prior $n_y/n$, feature $k_{jy}/n_y$ (within the class)."],
      ["Smoothing", "$(k+1)/(n_y+2)$ for a binary feature. Removes zero probabilities."],
      ["Prediction", "Largest $P(y)\\prod_jP(x_j|y)$. $P(x)$ cancels."],
      ["Gaussian NB", "Per class and feature mean and variance (divide by $n_c$). A density is a height."]
    ],
    cues: [
      ["posterior given a joint table", "Divide the joint by the sum of joints over classes."],
      ["how many parameters", "Count prior, then each feature per class. Subtract 1 where it must sum to 1."],
      ["estimate by counting", "Count within the class, divide by the class size."],
      ["predict the class", "Multiply prior by each feature term, take the largest."],
      ["unseen value, zero probability", "Use Laplace smoothing."],
      ["real-valued feature", "Gaussian density with that class's mean and variance."]
    ],
    traps: ["Dividing by $n$ instead of the class size $n_y$.", "Using $\\hat p$ when the feature value is 0 (should be $1-\\hat p$).", "Treating a density as a probability.", "Counting a shared variance twice, or forgetting the prior's parameter.", "Forgetting that independence is only <i>given the class</i>.", "Mixing up variance and standard deviation in $N(\\mu,\\sigma^2)$."],
    hooks: ["Prior times likelihood.", "Naive = independent given the class.", "Count inside the class.", "Zero count? Add one.", "Densities are heights.", "$P(x)$ cancels when comparing classes."]
  }
};
