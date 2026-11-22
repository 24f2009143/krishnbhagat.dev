/* Topic manifest. Adding a topic = add one data file and flip status to "ready". The engine never changes. */
window.MANIFEST = {
  site: "MLT Quiz 2 (Weeks 5 to 8)",
  topics: [
    { id: "linear-regression", n: 1, title: "Linear regression and gradient descent", blurb: "Least squares, projections, MLE view, gradient descent", status: "ready", file: "topics/linear-regression.js" },
    { id: "ridge-lasso-map", n: 2, title: "Ridge, Lasso and MAP", blurb: "Regularisation, priors, sparsity", status: "ready", file: "topics/ridge-lasso-map.js" },
    { id: "kernel-regression", n: 3, title: "Kernel regression", blurb: "Kernels, alpha, predictions", status: "ready", file: "topics/kernel-regression.js" },
    { id: "knn", n: 4, title: "k-NN", blurb: "Distances, k, classification and regression", status: "ready", file: "topics/knn.js" },
    { id: "decision-trees", n: 5, title: "Decision Trees", blurb: "Entropy, information gain, splits, depth, decision boundaries", status: "ready", file: "topics/decision-trees.js" },
    { id: "naive-bayes", n: 6, title: "Naive Bayes and generative models", blurb: "Bayes classifier, parameters, smoothing, Gaussian NB", status: "ready", file: "topics/naive-bayes.js" },
    { id: "cross-validation", n: 7, title: "Cross-validation and model comparison", blurb: "k-fold, LOOCV, choosing hyperparameters", status: "ready", file: "topics/cross-validation.js" },
    { id: "kmeans", n: 9, course: "q1", title: "K-means clustering", blurb: "Lloyd, objective, K-means++", status: "ready", file: "topics/kmeans.js" },
    { id: "pca", n: 10, course: "q1", title: "PCA", blurb: "Covariance, PCs, projections, reconstruction, dual PCA", status: "ready", file: "topics/pca.js" },
    { id: "kernels", n: 11, course: "q1", title: "Kernels and Kernel PCA", blurb: "Feature maps, valid kernels, polynomial, Gaussian, kernel PCA", status: "ready", file: "topics/kernels.js" },
    { id: "probability", n: 12, course: "q1", title: "Probability, MLE and MAP", blurb: "Bernoulli, exponential, Poisson, Pareto MLE, Beta posterior", status: "ready", file: "topics/probability.js" },
    { id: "gmm", n: 13, course: "q1", title: "GMM and EM, plus regression and GD", blurb: "Mixture likelihood, E-step, M-step, EM vs K-means, gradient descent", status: "ready", file: "topics/gmm.js" },
    { id: "legacy", n: 8, title: "Legacy: logistic, softmax, SVM", blurb: "Older material, kept last", status: "ready", file: "topics/legacy.js", legacy: true }
  ]
};
