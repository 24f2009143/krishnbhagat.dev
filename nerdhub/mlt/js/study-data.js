/* Study layer data: glossary, refreshers, exam moves. Plain text with KaTeX ($...$). */
(function () {
  const r = String.raw;
  const LR = 'linear-regression', RR = 'ridge-lasso-map', KR = 'kernel-regression', KN = 'knn', DT = 'decision-trees', NB = 'naive-bayes', CV = 'cross-validation';

  /* a = phrases that trigger the hover definition (lower case). auto:false = glossary page only */
  const glossary = [
    { k: 'feature', t: 'Feature', a: ['feature'], auto: false, tp: [LR, KN, DT, NB], d: r`One measured property of an example, such as the area of a house. Also called an input or attribute.`, ex: r`A house with area 80 and 3 rooms has two features: 80 and 3.` },
    { k: 'label', t: 'Label', a: ['label'], auto: false, tp: [LR, KN, DT, NB], d: r`The answer we want the model to predict for an example: a number (a price) or a class (spam or not spam).`, ex: r`Price 52 (a number) or class 1 (spam).` },
    { k: 'training-set', t: 'Training set', a: ['training set', 'training data'], tp: [CV, LR], d: r`The examples the model is allowed to learn from. Their labels are known.`, ex: r`Hospital records from last year used to fit the model.` },
    { k: 'test-set', t: 'Test set', a: ['test set'], tp: [CV], d: r`Examples kept hidden until the very end, used once to report how well the final model does.`, ex: r`Never use it to pick $\lambda$ or $k$. That is the validation set's job.` },
    { k: 'design-matrix', t: 'Design matrix', a: ['design matrix'], tp: [LR, RR], d: r`The matrix $X$ whose columns are the data points. In this course $X$ is $d\times n$: $d$ features and $n$ examples.`, ex: r`Two features, three points: $X$ has 2 rows and 3 columns, and $XX^T$ is $2\times2$.` },
    { k: 'transpose', t: 'Transpose', a: ['transpose'], tp: [LR, RR], d: r`Flip a matrix over its diagonal so rows become columns. Written $X^T$.`, ex: r`$\begin{bmatrix}1&2\end{bmatrix}^T$ is the column $\begin{bmatrix}1\\2\end{bmatrix}$.` },
    { k: 'identity', t: 'Identity matrix', a: ['identity matrix'], tp: [RR], d: r`The matrix $I$ with 1s on the diagonal and 0s elsewhere. Multiplying by it changes nothing. Ridge adds $\lambda I$, which adds $\lambda$ to the diagonal only.`, ex: r`$\begin{bmatrix}1&0\\0&1\end{bmatrix}$.` },
    { k: 'inverse', t: 'Inverse matrix', a: ['inverse of', 'matrix inverse', 'invertible'], tp: [LR, RR, KR], d: r`$A^{-1}$ undoes $A$: $A^{-1}A=I$. It exists only when the determinant is not zero. For $2\times2$: swap the diagonal, negate the off-diagonal, divide by the determinant.`, ex: r`$A=\begin{bmatrix}2&1\\1&3\end{bmatrix}$ has determinant $2\cdot3-1\cdot1=5$.` },
    { k: 'norm', t: 'Norm (length of a vector)', a: ['norm'], tp: [RR, KN], d: r`The length of a vector: $\|w\|=\sqrt{w_1^2+w_2^2+\cdots}$. Its square $\|w\|^2$ is simply the sum of squares.`, ex: r`$\|(3,4)\|=5$ and $\|(3,4)\|^2=25$.` },
    { k: 'l1', t: 'L1 norm', a: ['l1 norm', 'l_1 norm', 'one-norm'], tp: [RR], d: r`The sum of absolute values: $\|w\|_1=|w_1|+|w_2|+\cdots$. It is the lasso penalty.`, ex: r`$\|(3,-4)\|_1=3+4=7$.` },
    { k: 'gradient', t: 'Gradient', a: ['gradient'], tp: [LR], d: r`The vector of slopes of a function in each direction. It points uphill, so to go down we step the opposite way.`, ex: r`For $L(w)=(w-3)^2$ the gradient at $w=0$ is $2(0-3)=-6$.` },
    { k: 'gradient-descent', t: 'Gradient descent', a: ['gradient descent'], tp: [LR], d: r`Repeat $w\leftarrow w-\eta\nabla L(w)$: step a little downhill each time until the loss stops falling.`, ex: r`$L=(w-3)^2$, $w=0$, $\eta=0.25$: gradient $-6$, so the new $w$ is $0-0.25(-6)=1.5$.` },
    { k: 'learning-rate', t: 'Learning rate', a: ['learning rate', 'step size'], tp: [LR], d: r`$\eta$, the size of each gradient-descent step. Too small is slow; too large overshoots and can diverge.`, ex: r`Same $L$ with $\eta=1.1$: the new $w$ is $6.6$, which is $3.6$ from the minimum, worse than the start ($3$).` },
    { k: 'convex', t: 'Convex function', a: ['convex'], tp: [LR], d: r`A bowl-shaped function with one lowest point and no other dips. Squared error for linear regression is convex, so going downhill always reaches the answer.`, ex: r`$(w-3)^2$ is convex; a wavy curve with several valleys is not.` },
    { k: 'least-squares', t: 'Squared error / least squares', a: ['least squares', 'squared error', 'sum of squared'], tp: [LR, RR], d: r`Add up (prediction minus truth) squared over all examples. Least squares picks the weights that make this total smallest.`, ex: r`Truths $2,3$ and predictions $1,5$: $(1-2)^2+(5-3)^2=5$.` },
    { k: 'normal-eq', t: 'Normal equations', a: ['normal equations'], tp: [LR], d: r`The equations $XX^Tw=Xy$ you get by setting the gradient of the squared error to zero. Solving them gives the best weights.`, ex: r`One feature: $w=\sum xy/\sum x^2$.` },
    { k: 'residual', t: 'Residual', a: ['residual'], tp: [LR], d: r`Truth minus prediction for one example: $y_i-\hat y_i$. For least squares the residual vector is perpendicular to every feature.`, ex: r`Truth 3, prediction 2.5: residual $0.5$.` },
    { k: 'projection', t: 'Projection', a: ['projection'], tp: [LR], d: r`The shadow of a vector on a space. Least squares makes the fitted values the projection of $y$ onto the span of the features, so the residual is perpendicular to that span.`, ex: r`Projecting $(3,4)$ onto the $x$-axis gives $(3,0)$; the leftover $(0,4)$ is perpendicular.` },
    { k: 'argmin', t: 'argmin', a: ['argmin', 'argmax'], tp: [LR, RR, CV], d: r`The input that gives the smallest (argmax: largest) value, not the value itself.`, ex: r`For $(w-5)^2+3$ the minimum value is $3$ and the argmin is $w=5$.` },
    { k: 'likelihood', t: 'Likelihood', a: ['likelihood'], tp: [LR, RR, NB], d: r`How probable the observed data is, viewed as a function of the parameters: $P(\text{data}\mid w)$.`, ex: r`For a coin with chance $p$ of heads, 7 heads and 3 tails has likelihood $p^7(1-p)^3$.` },
    { k: 'mle', t: 'Maximum likelihood (MLE)', a: ['maximum likelihood', 'mle'], tp: [LR, NB], d: r`Choose the parameters that make the observed data most probable.`, ex: r`7 heads in 10 tosses: setting the slope of $7\ln p+3\ln(1-p)$ to zero gives $p=0.7$.` },
    { k: 'prior', t: 'Prior', a: ['prior'], tp: [RR, NB], d: r`What we believe about the parameters before seeing any data, written as a probability distribution.`, ex: r`"Weights are probably small" is a Gaussian prior centred at 0.` },
    { k: 'posterior', t: 'Posterior', a: ['posterior'], tp: [RR, NB], d: r`What we believe after seeing the data: proportional to likelihood times prior.`, ex: r`$P(\text{spam}\mid\text{word})$ is a posterior.` },
    { k: 'map', t: 'MAP estimate', a: ['map estimate', 'maximum a posteriori'], tp: [RR], d: r`Choose the parameters with the highest posterior, that is, maximise likelihood times prior. A Gaussian prior gives ridge; a Laplace prior gives lasso.`, ex: r`With Gaussian noise (variance $\sigma^2$) and prior variance $\gamma^2$: $\lambda=\sigma^2/\gamma^2$.` },
    { k: 'bayes-rule', t: "Bayes' rule", a: ["bayes' rule", "bayes rule", "bayes' theorem"], tp: [NB], d: r`$P(y\mid x)=\dfrac{P(x\mid y)P(y)}{P(x)}$. It turns "how likely is this data for the class" into "how likely is the class for this data".`, ex: r`$P(\text{spam})=0.4$, $P(w\mid\text{spam})=0.5$, $P(w\mid\text{not})=0.1$: $P(w)=0.26$ and $P(\text{spam}\mid w)=0.2/0.26\approx0.769$.` },
    { k: 'conditional', t: 'Conditional probability', a: ['conditional probability'], tp: [NB], d: r`$P(A\mid B)=P(A\cap B)/P(B)$: the chance of $A$ once we know $B$ happened.`, ex: r`$P(A\cap B)=0.2$, $P(B)=0.5$ gives $P(A\mid B)=0.4$.` },
    { k: 'independence', t: 'Independence', a: ['independent', 'independence'], auto: false, tp: [NB], d: r`$A$ and $B$ are independent when knowing one tells you nothing about the other: $P(A\cap B)=P(A)P(B)$.`, ex: r`$P(A)=0.5$, $P(B)=0.4$, independent: $P(A\cap B)=0.2$.` },
    { k: 'cond-indep', t: 'Conditional independence', a: ['conditionally independent', 'conditional independence', 'naive assumption'], tp: [NB], d: r`Independent once the class is known. Naive Bayes assumes the features are independent given the class, not independent overall.`, ex: r`Given the class "spam", the words "free" and "prize" are treated as unrelated.` },
    { k: 'generative', t: 'Generative model', a: ['generative model', 'generative'], tp: [NB], d: r`A model that learns how each class produces its data, $P(x\mid y)$ and $P(y)$, then classifies with Bayes' rule.`, ex: r`Naive Bayes is generative; plain regression is not.` },
    { k: 'parameter', t: 'Parameter', a: ['parameter'], auto: false, tp: [LR, NB], d: r`A number the model learns from the data, such as the weights in regression or the class probabilities in naive Bayes.`, ex: r`A line $y=wx$ has one parameter, $w$.` },
    { k: 'hyperparameter', t: 'Hyperparameter', a: ['hyperparameter'], tp: [CV, RR, KN, DT], d: r`A setting you choose before training: $\lambda$, $k$, the tree depth, the kernel degree. Choose it with validation error, never training error.`, ex: r`Try $k=1,3,5$ and keep the one with the lowest validation error.` },
    { k: 'overfitting', t: 'Overfitting', a: ['overfit', 'overfits', 'overfitting', 'overfitted'], tp: [CV, DT, KN, RR], d: r`The model fits noise in the training data: tiny training error but poor results on new data. The model is too flexible.`, ex: r`1-NN and a fully grown tree both reach zero training error.` },
    { k: 'underfitting', t: 'Underfitting', a: ['underfit', 'underfits', 'underfitting', 'underfitted'], tp: [CV, DT, KN, RR], d: r`The model is too simple for the pattern, so even the training error is high.`, ex: r`A horizontal line through a rising trend.` },
    { k: 'bias', t: 'Bias', a: ['high bias', 'low bias'], tp: [CV, KN], d: r`Error from the model being too simple to match the truth. Simple models have high bias.`, ex: r`Large $k$ in k-NN smooths too much: high bias.` },
    { k: 'variance', t: 'Variance', a: ['high variance', 'low variance'], tp: [CV, KN], d: r`How much the fitted model changes when the training data changes. Flexible models have high variance.`, ex: r`$k=1$ in k-NN changes a lot if one point moves.` },
    { k: 'regularisation', t: 'Regularisation', a: ['regularisation', 'regularization', 'regularised', 'regularized'], tp: [RR], d: r`Adding a penalty for large weights to the loss so the model stays simple: squared error $+\ \lambda\times$ penalty.`, ex: r`Ridge uses $\lambda\|w\|^2$; lasso uses $\lambda\|w\|_1$.` },
    { k: 'ridge', t: 'Ridge regression', a: ['ridge'], tp: [RR], d: r`Regularised regression with penalty $\lambda\|w\|^2$. Shrinks every weight smoothly toward zero but never exactly to zero.`, ex: r`One feature: $\hat w=\sum xy/(\sum x^2+\lambda)$.` },
    { k: 'lasso', t: 'Lasso regression', a: ['lasso'], tp: [RR], d: r`Regularised regression with penalty $\lambda\|w\|_1$. Can set some weights exactly to zero, which selects features.`, ex: r`Its constraint region is a diamond, with corners on the axes.` },
    { k: 'sparsity', t: 'Sparsity', a: ['sparse', 'sparsity'], tp: [RR], d: r`Many weights are exactly zero, so the model uses only a few features.`, ex: r`$w=(0,2.1,0,0.4)$ is sparse.` },
    { k: 'shrinkage', t: 'Shrinkage', a: ['shrink', 'shrinks', 'shrinkage', 'shrinking'], tp: [RR], d: r`Pulling the weights toward zero. For one feature, ridge multiplies the least-squares weight by $\sum x^2/(\sum x^2+\lambda)$, a number between 0 and 1.`, ex: r`$\sum x^2=10$, $\lambda=10$: multiply by $0.5$.` },
    { k: 'validation', t: 'Validation set', a: ['validation set', 'validation error', 'validation'], tp: [CV], d: r`Data held out of training and used to choose hyperparameters.`, ex: r`Smallest validation error wins.` },
    { k: 'kfold', t: 'k-fold cross-validation', a: ['k-fold', 'cross-validation', 'cross validation'], tp: [CV], d: r`Split the data into $k$ parts. Train on $k-1$ parts, validate on the remaining one, rotate through all parts, then average the $k$ validation errors.`, ex: r`$n=100$, $k=5$: each model trains on 80 points, validates on 20, and 5 models are fitted per setting.` },
    { k: 'loocv', t: 'Leave-one-out (LOOCV)', a: ['leave-one-out', 'loocv', 'leave one out'], tp: [CV, KN, LR], d: r`Cross-validation with $k=n$: each point is predicted by a model trained on the other $n-1$ points.`, ex: r`5 points: 5 models, each trained on 4.` },
    { k: 'grid-search', t: 'Grid search', a: ['grid search'], tp: [CV], d: r`Try every combination of candidate settings, score each by validation error and keep the best. Models trained = number of settings $\times k$.`, ex: r`4 values of $\lambda$ and 5 folds: 20 models.` },
    { k: 'train-err', t: 'Training error', a: ['training error', 'training loss'], tp: [CV, KN, DT], d: r`Error on the data the model learned from. It is optimistic and keeps falling as the model gets more flexible, so it cannot choose the model.`, ex: r`k-NN with $k=1$ has training error $0$.` },
    { k: 'test-err', t: 'Test error', a: ['test error', 'generalisation error', 'generalization error'], tp: [CV], d: r`Error on fresh data, used once at the end to estimate real performance.`, ex: r`Report it; do not tune on it.` },
    { k: 'laplace', t: 'Laplace smoothing', a: ['laplace smoothing', 'smoothing'], tp: [NB], d: r`Add 1 to every count so a value never seen in training does not get probability 0. For a binary feature: $(k+1)/(n_y+2)$.`, ex: r`$k=0$, $n_y=4$: $\tfrac{0+1}{4+2}=\tfrac16$ instead of $0$.` },
    { k: 'gaussian', t: 'Gaussian density', a: ['gaussian density', 'normal density', 'gaussian'], tp: [NB, RR, LR], d: r`The bell-curve height $\frac1{\sqrt{2\pi\sigma^2}}e^{-(x-\mu)^2/(2\sigma^2)}$. It is a height, not a probability, so it can be bigger than 1.`, ex: r`$\sigma=0.1$ at the mean: height $\approx3.99$.` },
    { k: 'entropy', t: 'Entropy', a: ['entropy'], tp: [DT], d: r`How mixed a group of labels is: $E=-p\log_2p-(1-p)\log_2(1-p)$. It is $0$ for a pure group and $1$ for a half-half group.`, ex: r`A 75/25 group: $E=0.811$.` },
    { k: 'ig', t: 'Information gain', a: ['information gain'], tp: [DT], d: r`Parent entropy minus the size-weighted entropy of the children. The bigger the gain, the better the question.`, ex: r`4+/4- split into (3+,1-) and (1+,3-): $1-0.811=0.189$.` },
    { k: 'tree-words', t: 'Root, node, leaf, depth', a: ['root node', 'leaf', 'leaves'], tp: [DT], d: r`A tree starts at the root (first question); internal nodes ask questions; leaves hold predictions. Depth is the number of edges on the longest root-to-leaf path.`, ex: r`A single leaf has depth $0$.` },
    { k: 'greedy', t: 'Greedy', a: ['greedy'], tp: [DT], d: r`Choose what looks best right now without looking ahead. A tree picks the best question at each node, not the best whole tree.`, ex: r`That is why two different trees can both be "greedy-optimal" at the root.` },
    { k: 'decision-boundary', t: 'Decision boundary', a: ['decision boundary'], tp: [DT, KN], d: r`The line or surface where the predicted class changes. Trees give boxes with axis-parallel edges; k-NN gives jagged curves.`, ex: r`Larger $k$ makes the k-NN boundary smoother.` },
    { k: 'kernel', t: 'Kernel', a: ['kernel function', 'kernel'], tp: [KR], d: r`A function $k(x,x')$ equal to the dot product of lifted features, $\phi(x)^T\phi(x')$, computed without ever building $\phi$.`, ex: r`$(x^Tx'+1)^2$ with $x=(1,2)$, $x'=(3,1)$: $(5+1)^2=36$.` },
    { k: 'kernel-matrix', t: 'Kernel matrix', a: ['kernel matrix', 'gram matrix'], tp: [KR], d: r`The $n\times n$ table with entries $K_{ij}=k(x_i,x_j)$. Always symmetric and positive semi-definite.`, ex: r`The diagonal entries are $k(x_i,x_i)$.` },
    { k: 'feature-map', t: 'Feature map', a: ['feature map'], tp: [KR], d: r`$\phi(x)$: a function that turns inputs into new features, such as adding $x^2$ to $x$, so a straight-line fit becomes a curve.`, ex: r`$\phi(x)=(1,x,x^2)$.` },
    { k: 'psd', t: 'Positive semi-definite', a: ['positive semi-definite', 'positive semidefinite'], tp: [KR], d: r`A symmetric matrix $K$ with $v^TKv\ge0$ for every vector $v$. Every valid kernel matrix has this property.`, ex: r`The identity matrix is positive semi-definite.` },
    { k: 'nonparam', t: 'Non-parametric', a: ['non-parametric', 'nonparametric'], tp: [KN, KR], d: r`The model's size grows with the data. k-NN keeps all points; kernel regression has one coefficient $\alpha_i$ per training point.`, ex: r`More data means more stored numbers.` },
    { k: 'lazy', t: 'Lazy learner', a: ['lazy learner', 'lazy'], tp: [KN], d: r`Does no work in training and just stores the data. All the work happens at prediction time.`, ex: r`k-NN needs $n$ distance computations per prediction.` },
    { k: 'vote', t: 'Majority vote', a: ['majority vote', 'majority'], tp: [KN], d: r`Each of the $k$ neighbours votes for its own label and the most common label wins.`, ex: r`Labels $1,0,1$ among 3 neighbours: predict $1$.` },
    { k: 'euclid', t: 'Euclidean distance', a: ['euclidean'], tp: [KN], d: r`Straight-line distance: $\sqrt{\sum_i(a_i-b_i)^2}$.`, ex: r`$a=(1,2)$, $b=(4,6)$: $\sqrt{9+16}=5$.` },
    { k: 'manhattan', t: 'Manhattan distance', a: ['manhattan'], tp: [KN], d: r`Distance walking along a grid: $\sum_i|a_i-b_i|$.`, ex: r`Same $a,b$: $3+4=7$.` },
    { k: 'bayes-clf', t: 'Bayes classifier', a: ['bayes classifier'], tp: [NB], d: r`Predicts the class with the highest posterior probability. It is the best any classifier can do when the probabilities are known.`, ex: r`Compare $P(y=1\mid x)$ with $P(y=0\mid x)$ and pick the larger.` }
  ];

  /* refreshers: short lessons for the maths that every topic quietly uses */
  const refreshers = [
    {
      id: 'notation', icon: '🔣', t: 'Reading the notation', one: 'Σ, argmin, vectors, transposes and dot products',
      body: [
        ['Why this matters', r`<p>Every formula in this course is built from a handful of symbols. If a symbol is a mystery, the whole line is a mystery. Learn these once.</p>`],
        ['Summation: Σ', r`<p>$\sum_{i=1}^{n}a_i$ means "add $a_1+a_2+\cdots+a_n$". The little $i=1$ and $n$ say where to start and stop.</p><div class="box worked-x"><div class="bt">Example</div>$\sum_{i=1}^{4}2i=2+4+6+8=20$.</div>`],
        ['Vectors and the dot product', r`<p>A vector is a list of numbers, usually a column. The <b>dot product</b> multiplies matching entries and adds: $w^Tx=w_1x_1+w_2x_2+\cdots$. The little $T$ is the transpose: it turns a column into a row so that the product makes sense.</p><div class="box worked-x"><div class="bt">Example</div>$w=(1,2,3)$, $x=(4,5,6)$: $w^Tx=1\cdot4+2\cdot5+3\cdot6=4+10+18=32$.</div>`],
        ['Length of a vector', r`<p>$\|w\|=\sqrt{w_1^2+w_2^2+\cdots}$. We usually use $\|w\|^2=w_1^2+w_2^2+\cdots=w^Tw$, which has no square root.</p><div class="box worked-x"><div class="bt">Example</div>$w=(3,4)$: $\|w\|^2=9+16=25$, so $\|w\|=5$.</div>`],
        ['argmin and argmax', r`<p>$\min_w f(w)$ is the smallest <i>value</i>. $\arg\min_w f(w)$ is the <i>input</i> that gives it. Regression is written "find the argmin of the loss".</p><div class="box worked-x"><div class="bt">Example</div>$f(w)=(w-5)^2+3$: the smallest value is $3$, reached at $w=5$, so $\arg\min=5$.</div>`],
        ['Subscripts and superscripts', r`<p>$x_i$ is the $i$-th data point. $x_{ij}$ or $x_j$ is feature $j$. $a^2$ is a square, but $w^{(t)}$ (with brackets) is "the value of $w$ after step $t$". Read the brackets.</p>`]
      ],
      quiz: [
        { s: r`What is $\sum_{i=1}^{4}2i$?`, o: ['10', '20', '24', '16'], ok: 1, w: r`$2+4+6+8=20$.` },
        { s: r`For $w=(1,2,3)$ and $x=(4,5,6)$, what is $w^Tx$?`, o: ['15', '21', '32', '120'], ok: 2, w: r`$4+10+18=32$. Multiply matching entries, then add.` },
        { s: r`What is $\arg\min_w\,(w-5)^2+3$?`, o: ['3', '5', '0', '8'], ok: 1, w: r`The value $3$ is the minimum <i>value</i>; the argmin is the input $w=5$ that produces it.` }
      ]
    },
    {
      id: 'calculus', icon: '📉', t: 'Derivatives and slope = 0', one: 'How we find the lowest point of a loss',
      body: [
        ['Why this matters', r`<p>Training a model means finding the weights that make a loss as small as possible. The trick: at the bottom of a smooth bowl the slope is zero. So we find where the slope (derivative) is zero.</p>`],
        ['The derivative is the slope', r`<p>$f'(w)$ tells you how fast $f$ changes as $w$ grows. Positive: going up. Negative: going down. Zero: flat, which is where a minimum sits.</p>`],
        ['The four rules you need', r`<ul><li>Power: $\dfrac{d}{dw}w^n=nw^{n-1}$. So $\dfrac{d}{dw}3w^2=6w$.</li><li>Constant: $\dfrac{d}{dw}c=0$.</li><li>Sum: differentiate each term.</li><li>Chain: $\dfrac{d}{dw}(a-bw)^2=2(a-bw)\cdot(-b)$.</li></ul>`],
        ['Find the minimum', r`<div class="box worked-x"><div class="bt">Example</div>$f(w)=(w-4)^2+1$. Then $f'(w)=2(w-4)$. Set it to zero: $w=4$. Minimum value $f(4)=1$.</div><p>Check with the second derivative: $f''=2>0$ means a bowl (minimum), not a hill.</p>`],
        ['This is least squares', r`<p>With one feature, $L(w)=\sum_i(y_i-wx_i)^2$. Then $L'(w)=-2\sum_ix_i(y_i-wx_i)=0$, so $\sum x_iy_i=w\sum x_i^2$ and $w=\dfrac{\sum xy}{\sum x^2}$.</p><div class="box worked-x"><div class="bt">Example</div>$x=(1,2,3)$, $y=(2,4,5)$: $\sum xy=2+8+15=25$, $\sum x^2=1+4+9=14$, $w=25/14\approx1.786$.</div>`],
        ['Several weights: the gradient', r`<p>With many weights, take the slope in each direction separately (partial derivatives) and stack them into a vector: the <b>gradient</b> $\nabla L$. Set all of it to zero, or walk downhill: $w\leftarrow w-\eta\nabla L$.</p>`]
      ],
      quiz: [
        { s: r`What is $\dfrac{d}{dw}\,3w^2$?`, o: ['$3w$', '$6w$', '$6w^2$', '$3$'], ok: 1, w: r`Power rule: bring down the 2 and multiply: $3\cdot2w=6w$.` },
        { s: r`Where is $f(w)=(w-4)^2+1$ smallest?`, o: ['$w=1$', '$w=4$', '$w=-4$', '$w=5$'], ok: 1, w: r`$f'(w)=2(w-4)=0$ gives $w=4$.` },
        { s: r`$x=(1,2)$, $y=(2,3)$, one feature, no intercept. What is the least-squares $w$?`, o: ['$1.6$', '$1.5$', '$1$', '$2.5$'], ok: 0, w: r`$\sum xy=2+6=8$, $\sum x^2=1+4=5$, $w=8/5=1.6$.` }
      ]
    },
    {
      id: 'matrices', icon: '🧮', t: 'Matrices for machine learning', one: 'Shapes, products, transposes and 2×2 inverses',
      body: [
        ['Why this matters', r`<p>The best weights in linear and ridge regression, and the coefficients in kernel regression, all come from solving a matrix equation. You will do these by hand on $2\times2$ examples.</p>`],
        ['Shapes first', r`<p>A matrix with $m$ rows and $n$ columns is $m\times n$. Two matrices multiply only if the inner sizes match, and the result takes the outer sizes: $(m\times n)(n\times p)=m\times p$.</p><div class="box worked-x"><div class="bt">Example</div>$A$ is $2\times3$ and $B$ is $3\times4$, so $AB$ is $2\times4$. In this course $X$ is $d\times n$, so $XX^T$ is $d\times d$ and $X^TX$ is $n\times n$.</div>`],
        ['Multiplying', r`<p>Entry $(i,j)$ of $AB$ = (row $i$ of $A$) dot (column $j$ of $B$).</p><div class="box worked-x"><div class="bt">Example</div>$X=\begin{bmatrix}2&3\\4&1\end{bmatrix}$. Then $XX^T$: top-left $2\cdot2+3\cdot3=13$; off-diagonal $2\cdot4+3\cdot1=11$; bottom-right $4\cdot4+1\cdot1=17$. So $XX^T=\begin{bmatrix}13&11\\11&17\end{bmatrix}$.</div>`],
        ['The 2×2 inverse', r`<p>For $A=\begin{bmatrix}a&b\\c&d\end{bmatrix}$: $\det A=ad-bc$ and $A^{-1}=\dfrac1{\det A}\begin{bmatrix}d&-b\\-c&a\end{bmatrix}$. If $\det A=0$ there is no inverse.</p>`],
        ['Solve a system', r`<p>To solve $Aw=b$, compute $w=A^{-1}b$.</p><div class="box worked-x"><div class="bt">Example</div>$A=\begin{bmatrix}2&1\\1&3\end{bmatrix}$, $b=(3,5)$. $\det A=5$, $A^{-1}=\tfrac15\begin{bmatrix}3&-1\\-1&2\end{bmatrix}$, so $w=\tfrac15(3\cdot3-5,\ -3+2\cdot5)=\tfrac15(4,7)=(0.8,1.4)$. Check: $2(0.8)+1.4=3$ and $0.8+3(1.4)=5$. ✓</div>`],
        ['Ridge adds to the diagonal', r`<p>$\lambda I$ is $\lambda$ on the diagonal and 0 elsewhere. So $XX^T+\lambda I$ changes only the diagonal entries.</p>`]
      ],
      quiz: [
        { s: r`$A$ is $2\times3$ and $B$ is $3\times4$. What is the shape of $AB$?`, o: ['$3\\times3$', '$2\\times4$', '$4\\times2$', 'Not defined'], ok: 1, w: r`Inner sizes (3 and 3) match; the result takes the outer sizes, $2\times4$.` },
        { s: r`What is $\det\begin{bmatrix}2&1\\1&3\end{bmatrix}$?`, o: ['$7$', '$5$', '$6$', '$1$'], ok: 1, w: r`$2\cdot3-1\cdot1=5$.` },
        { s: r`$X$ is $3\times10$ ($d\times n$). What is the shape of $XX^T$?`, o: ['$10\\times10$', '$3\\times3$', '$3\\times10$', '$10\\times3$'], ok: 1, w: r`$(3\times10)(10\times3)=3\times3$.` }
      ]
    },
    {
      id: 'probability', icon: '🎲', t: 'Probability you need', one: 'Conditional, independence, Bayes and likelihood',
      body: [
        ['Why this matters', r`<p>Naive Bayes is pure probability. Ridge and lasso also come from probability (priors). A short, solid refresher saves a lot of confusion.</p>`],
        ['Probability and conditional probability', r`<p>$P(A)$ is between 0 and 1. $P(A\mid B)$ means "the chance of $A$ <i>given</i> $B$ happened": $P(A\mid B)=\dfrac{P(A\cap B)}{P(B)}$.</p><div class="box worked-x"><div class="bt">Example</div>$P(A\cap B)=0.2$, $P(B)=0.5$, so $P(A\mid B)=0.4$.</div>`],
        ['Independence', r`<p>$A$ and $B$ are independent if $P(A\cap B)=P(A)P(B)$.</p><div class="box worked-x"><div class="bt">Example</div>$P(A)=0.5$, $P(B)=0.4$: if independent, $P(A\cap B)=0.2$.</div>`],
        ["Bayes' rule", r`<p>$P(y\mid x)=\dfrac{P(x\mid y)P(y)}{P(x)}$, where $P(x)=\sum_yP(x\mid y)P(y)$.</p><div class="box worked-x"><div class="bt">Example</div>$P(\text{spam})=0.4$, $P(w\mid\text{spam})=0.5$, $P(w\mid\text{not})=0.1$. Then $P(w)=0.5\cdot0.4+0.1\cdot0.6=0.26$ and $P(\text{spam}\mid w)=0.2/0.26\approx0.769$.</div>`],
        ['Likelihood and MLE', r`<p>Likelihood: the probability of the data you saw, as a function of the unknown parameter. MLE picks the parameter that makes the data most probable.</p><div class="box worked-x"><div class="bt">Example</div>7 heads in 10 tosses, chance $p$: likelihood $p^7(1-p)^3$. Take logs: $7\ln p+3\ln(1-p)$. Slope $=\tfrac7p-\tfrac3{1-p}=0$ gives $p=0.7$. (MLE for a proportion is always "count / total".)</div>`],
        ['A density is a height', r`<p>For a real-valued variable (Gaussian), the formula gives a <b>density</b>, a height on the curve. It is not a probability and can exceed 1. Compare densities with each other, never with 1.</p>`]
      ],
      quiz: [
        { s: r`$P(A\cap B)=0.2$ and $P(B)=0.5$. What is $P(A\mid B)$?`, o: ['$0.1$', '$0.4$', '$0.7$', '$0.2$'], ok: 1, w: r`$0.2/0.5=0.4$.` },
        { s: r`$P(\text{spam})=0.4$, $P(w\mid\text{spam})=0.5$, $P(w\mid\text{not})=0.1$. What is $P(w)$?`, o: ['$0.6$', '$0.26$', '$0.2$', '$0.05$'], ok: 1, w: r`$0.5\cdot0.4+0.1\cdot0.6=0.2+0.06=0.26$.` },
        { s: r`7 heads in 10 tosses. What is the maximum-likelihood estimate of the chance of heads?`, o: ['$0.5$', '$0.7$', '$0.3$', '$7$'], ok: 1, w: r`The MLE of a proportion is count over total: $7/10$.` }
      ]
    },
    {
      id: 'logs', icon: '🪵', t: 'Logs and exponentials', one: 'The log rules behind entropy and likelihood',
      body: [
        ['Why this matters', r`<p>Entropy uses $\log_2$. Likelihoods are products, and logs turn products into sums, which is why "log-likelihood" appears everywhere.</p>`],
        ['What a log is', r`<p>$\log_b x$ answers "what power of $b$ gives $x$?". So $\log_28=3$ because $2^3=8$, and $\log_2\tfrac14=-2$ because $2^{-2}=\tfrac14$.</p>`],
        ['The rules', r`<ul><li>$\log(ab)=\log a+\log b$</li><li>$\log(a/b)=\log a-\log b$</li><li>$\log(a^n)=n\log a$</li><li>$\ln(e^x)=x$, and $\ln$ means $\log_e$</li><li>Change of base: $\log_2x=\ln x/\ln2$</li></ul>`],
        ['ln versus log₂', r`<p>$\ln 8=2.079$ but $\log_28=3$. Entropy needs $\log_2$. Using $\ln$ gives a smaller number (the maximum for two classes would be $0.693$ instead of $1$) and loses the mark.</p>`],
        ['Entropy by hand', r`<p>$E(p)=-p\log_2p-(1-p)\log_2(1-p)$.</p><div class="box worked-x"><div class="bt">Example</div>$p=\tfrac12$: $-\tfrac12(-1)-\tfrac12(-1)=1$. $p=\tfrac34$: $-0.75\log_20.75-0.25\log_20.25=0.75(0.415)+0.25(2)=0.311+0.5=0.811$.</div>`],
        ['Why products become sums', r`<p>Likelihood of independent points is a product $\prod_i p_i$. Taking the log gives $\sum_i\log p_i$, which is easier to differentiate and safer for computers.</p>`]
      ],
      quiz: [
        { s: r`What is $\log_2(1/4)$?`, o: ['$-2$', '$2$', '$-4$', '$0.25$'], ok: 0, w: r`$2^{-2}=1/4$.` },
        { s: r`Which is larger, $\ln 8$ or $\log_2 8$?`, o: ['$\\ln 8$', '$\\log_2 8$', 'They are equal', 'Cannot tell'], ok: 1, w: r`$\log_28=3$ while $\ln8\approx2.079$.` },
        { s: r`What is the entropy of a 50/50 node?`, o: ['$0$', '$0.5$', '$1$', '$0.693$'], ok: 2, w: r`$-\tfrac12\log_2\tfrac12\cdot2=1$. ($0.693$ is what you get using $\ln$ by mistake.)` }
      ]
    },
    {
      id: 'distance', icon: '📏', t: 'Distance, norm and penalty', one: 'L1, L2 and why the ridge and lasso shapes differ',
      body: [
        ['Why this matters', r`<p>k-NN is built on distance. Ridge and lasso are built on norms. They are the same idea: measuring size.</p>`],
        ['Two ways to measure', r`<ul><li><b>Euclidean (L2):</b> $\sqrt{\sum(a_i-b_i)^2}$, the straight line.</li><li><b>Manhattan (L1):</b> $\sum|a_i-b_i|$, walking along the grid.</li></ul><div class="box worked-x"><div class="bt">Example</div>$a=(1,2)$, $b=(4,6)$: differences $(-3,-4)$. Euclidean $\sqrt{9+16}=5$. Manhattan $3+4=7$.</div>`],
        ['Norm of a weight vector', r`<p>Same formulas, with the distance from the origin. $\|w\|^2=\sum w_i^2$ (ridge penalty). $\|w\|_1=\sum|w_i|$ (lasso penalty).</p><div class="box worked-x"><div class="bt">Example</div>$w=(3,-4)$: $\|w\|^2=9+16=25$ and $\|w\|_1=3+4=7$.</div>`],
        ['Shapes', r`<p>All points with $\|w\|^2\le\theta$ form a <b>circle</b> (a ball). All points with $\|w\|_1\le\theta$ form a <b>diamond</b>. The diamond has sharp corners on the axes, and the best fit often touches a corner, where some weight is exactly zero. That is why lasso gives sparse answers and ridge does not.</p>`],
        ['Compare squared distances', r`<p>To find the nearest neighbour you can compare squared Euclidean distances. The square root never changes which of two non-negative numbers is bigger.</p>`],
        ['Scale matters', r`<p>If one feature is measured in thousands and another in ones, the big one dominates the distance. Rescale features before using k-NN.</p>`]
      ],
      quiz: [
        { s: r`$a=(1,2)$, $b=(4,6)$. What is the Manhattan distance?`, o: ['$5$', '$7$', '$25$', '$3$'], ok: 1, w: r`$|1-4|+|2-6|=3+4=7$. ($5$ is the Euclidean distance.)` },
        { s: r`What is $\|w\|^2$ for $w=(3,-4)$?`, o: ['$7$', '$5$', '$25$', '$-7$'], ok: 2, w: r`$9+16=25$. ($7$ is the L1 norm.)` },
        { s: r`Which penalty has a diamond-shaped constraint region?`, o: ['Ridge ($L_2$)', 'Lasso ($L_1$)', 'Both', 'Neither'], ok: 1, w: r`$|w_1|+|w_2|\le\theta$ is a diamond. $w_1^2+w_2^2\le\theta$ is a circle.` }
      ]
    }
  ];

  /* exam moves: type | fast method | time | sanity check */
  const moves = {};
  moves[LR] = [
    [r`Best weight, one feature, no intercept`, r`$w^*=\sum x_iy_i/\sum x_i^2$. Write one column for $xy$ and one for $x^2$, add each.`, '2 min', r`$\sum x_i(y_i-w^*x_i)=0$.`],
    [r`Best weights, several features`, r`Normal equations $XX^Tw=Xy$ with $X$ of size $d\times n$. Build $XX^T$ and $Xy$, then solve the $2\times2$ system with the determinant.`, '4 min', r`Multiply $XX^Tw$ and compare with $Xy$.`],
    [r`Value after one gradient-descent step`, r`$w_{new}=w-\eta\nabla L(w)$, with $\nabla L=2X(X^Tw-y)$ for $L=\|X^Tw-y\|^2$. A $\frac12$ in the loss removes the 2.`, '2 min', r`Check which loss is stated. Did the loss go down?`],
    [r`What changes if I scale $x$ or $y$, or change the noise variance?`, r`$y\to cy$: $w^*\to cw^*$. $x\to cx$: $w^*\to w^*/c$. $\sigma^2$ never changes $\hat w$.`, '1 min', r`Try one number.`],
    [r`Can the training error be zero?`, r`Is $y$ in the span of the feature columns? Zero exactly when it is.`, '2 min', r`A perfect line through all points means yes.`]
  ];
  moves[RR] = [
    [r`Ridge weights, numeric`, r`$(XX^T+\lambda I)^{-1}Xy$. Add $\lambda$ to the diagonal only. One feature: $\hat w=\sum xy/(\sum x^2+\lambda)$.`, '3 min', r`With $\lambda=0$ you must get least squares; ridge is smaller in size.`],
    [r`Ratio of ridge to least-squares weight (one feature)`, r`$\sum x^2/(\sum x^2+\lambda)$. $y$ cancels.`, '1 min', r`A number between 0 and 1.`],
    [r`Which vector is chosen under $\|w\|^2\le\theta$`, r`Cross out vectors with $\|w\|^2>\theta$, then take the smallest error among the rest.`, '2 min', r`Recompute $\|w\|^2$ for the winner.`],
    [r`Which solution is the lasso / sparse`, r`The one with exact zeros. Ridge only shrinks, it never gives exact zeros.`, '1 min', r`Circle (ridge) versus diamond (lasso).`],
    [r`$\lambda$ from Gaussian noise and prior`, r`$\lambda=\sigma^2/\gamma^2$: noise variance over prior variance.`, '1 min', r`A wide prior means a small $\lambda$.`]
  ];
  moves[KR] = [
    [r`Kernel matrix`, r`Entry $(i,j)=k(x_i,x_j)$. Fill the upper triangle and copy it across, since $K$ is symmetric.`, '3 min', r`Symmetric, and every diagonal entry is $k(x_i,x_i)$.`],
    [r`Find $\alpha$`, r`Solve $K\alpha=y$ by elimination, or $\alpha=K^{-1}y$ using the $2\times2$ determinant.`, '3 min', r`Multiply $K\alpha$ and compare with $y$.`],
    [r`Predict at a new point $x$`, r`$\hat y(x)=\sum_i\alpha_ik(x_i,x)$. Compute $k(x_i,x)$ for every training point.`, '2 min', r`Training points must be on the left: $k(x_i,x)$.`],
    [r`Prediction at the zero vector`, r`For $(x^Tx'+c)^p$: $k(x_i,0)=c^p$, so $\hat y=c^p\sum_i\alpha_i$.`, '1 min', r`Plug in $c$ and $p$ separately.`],
    [r`Parametric or not? Training error?`, r`Non-parametric (the number of $\alpha$'s grows with $n$). Training error is $0$ when $K$ is invertible.`, '1 min', r`Does the model size grow with $n$?`]
  ];
  moves[KN] = [
    [r`Classify a new point`, r`Distance to every training point (squared is fine), sort, take the $k$ nearest, vote.`, '3 min', r`Is there a tie? Use the rule given in the question.`],
    [r`Training error with $k=1$`, r`Zero: each point is its own nearest neighbour (unless identical points have different labels).`, '1 min', r`Any duplicates with different labels?`],
    [r`Leave-one-out error`, r`Hide one point, predict it from the other $n-1$, count mistakes, divide by $n$.`, '4 min', r`A point must not vote for itself.`],
    [r`How many distance computations?`, r`$n$ per prediction, independent of $k$ ($n\cdot d$ basic operations).`, '1 min', r`Does the answer mention $k$? Then it is wrong.`],
    [r`Predict a number (regression)`, r`Average the $k$ nearest labels.`, '2 min', r`The answer must lie between the neighbours' values.`]
  ];
  moves[DT] = [
    [r`Entropy of a node`, r`Proportion $p$, then $E=-p\log_2p-(1-p)\log_2(1-p)$. Pure: $0$. Half-half: $1$. 75/25: $0.811$.`, '2 min', r`Always between $0$ and $1$ for two classes.`],
    [r`Information gain of a question`, r`Parent entropy minus the weighted child entropy. Weights are child size over parent size.`, '4 min', r`Gain is at least $0$ and at most the parent's entropy.`],
    [r`Which question is better?`, r`The parent is shared, so the lower weighted child entropy (higher gain) wins.`, '3 min', r`Never compare unweighted child entropies.`],
    [r`Depth, leaves, number of questions`, r`Depth = edges on the longest path. Leaves $\le2^{\text{depth}}$. Questions = leaves $-1$ when every internal node splits in two.`, '1 min', r`A single leaf has depth $0$.`],
    [r`Predict with a given tree`, r`Start at the root and follow the answers to a leaf.`, '1 min', r`Did you test the right feature at each node?`]
  ];
  moves[NB] = [
    [r`Posterior from a joint table`, r`Divide the joint entry by the sum of the joint entries over all classes.`, '2 min', r`Posteriors over classes add to 1.`],
    [r`How many parameters?`, r`Binary features, $K$ classes: $(K-1)+Kd$. Full joint table: $K2^d-1$.`, '2 min', r`Subtract 1 wherever probabilities must sum to 1.`],
    [r`Estimate by counting`, r`Prior $=n_y/n$. Feature $=$ count within the class $/\,n_y$.`, '3 min', r`Divide by the class size, not $n$.`],
    [r`Predict the class`, r`Compare $P(y)\prod_jP(x_j\mid y)$ for each class. $P(x)$ cancels.`, '3 min', r`For a feature value 0 use $1-\hat p$.`],
    [r`A zero count appears`, r`Laplace smoothing: $(k+1)/(n_y+2)$ for a binary feature.`, '1 min', r`No probability is exactly $0$ now.`],
    [r`A real-valued feature`, r`Gaussian density per class and feature; variance divides by $n_c$.`, '3 min', r`A density is a height, not a probability.`]
  ];
  moves[CV] = [
    [r`Choose $\lambda$, $k$ or depth from a table`, r`Take the row with the smallest <i>validation</i> error.`, '1 min', r`Ignore the training-error column.`],
    [r`How many models are trained?`, r`$k$-fold: settings $\times k$. LOOCV: settings $\times n$.`, '1 min', r`Did you multiply by the number of settings?`],
    [r`Fold sizes`, r`Training $n(k-1)/k$, validation $n/k$.`, '1 min', r`The two add up to $n$.`],
    [r`Leave-one-out for a line`, r`Refit the line $n$ times, each on $n-1$ points. Predict the held-out point, average the errors.`, '5 min', r`Never reuse the full-data line.`],
    [r`Can this model reach zero training error?`, r`Fully grown tree and 1-NN: yes. A linear model or naive Bayes: not guaranteed.`, '1 min', r`Can it repeat every training label?`]
  ];

  window.STUDY = { glossary, refreshers, moves };
})();
