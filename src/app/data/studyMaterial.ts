/**
 * Study material content - parsed from studymaterial file
 * Organized by topic name matching the JSON keys
 */

export const STUDY_MATERIAL_CONTENT: Record<string, string> = {
  'Introduction to Machine Learning': `Definition: Machine learning (ML) is a subset of AI focused on algorithms that learn patterns from data to make predictions or decisions without being explicitly programmed. In other words, ML models improve their performance on tasks by learning from examples.

Learning Paradigms: Common types of ML include supervised learning (training on labeled data to predict outputs, e.g. classification or regression tasks), unsupervised learning (finding patterns or groupings in unlabeled data), and reinforcement learning (an agent learning through trial and error using rewards and penalties).

Generalization: The goal is for learned models to generalize to new, unseen data. Overfitting (memorizing training data too closely) is undesirable; instead, models should capture underlying patterns that apply broadly.`,

  'Data Understanding': `Exploratory Data Analysis (EDA): Before modeling, it's crucial to understand your dataset's characteristics. EDA involves summarizing data distributions (using measures like mean, median, and standard deviation), visualizing data (plots like histograms, box plots, scatter plots), and identifying anomalies or outliers (data points that deviate significantly from others).

Outliers & Patterns: Outliers can skew analyses (e.g., a very large value can raise the mean). By detecting outliers, one can decide to investigate them or remove them if they are errors. EDA also helps reveal patterns such as correlations between variables or data groupings.

Data Quality: Data understanding includes assessing data quality – checking for missing values, inconsistent entries, or errors. Gaining insights into how data is structured and distributed guides the next steps of data preprocessing and modeling.`,

  'Data Preprocessing': `Definition: Data preprocessing is the step of cleaning and transforming raw data into a format suitable for modeling. This ensures that the dataset is consistent and ready for machine learning algorithms to learn effectively.

Common Steps: This can include handling missing values (e.g., imputation by mean/median, or removal of missing entries), encoding categorical variables (turning categories into numeric form, such as one-hot encoding), and feature scaling (normalizing or standardizing numerical features to a similar range).

Why It Matters: Proper preprocessing can improve model performance and training stability. For example, many algorithms perform better when features are on comparable scales, and categorical data must be numeric for most ML models. By addressing issues like missing or inconsistent data, we prevent these problems from biasing or distorting the model's learning.`,

  'Data Visualization': `Role: Data visualization is the practice of creating graphical representations of data. It helps humans understand complex data patterns, trends, and outliers at a glance.

Techniques: Common visualizations include scatter plots (to see relationships between two numerical variables), histograms (to view the distribution of a single numeric variable), box plots (to show the median, quartiles, and outliers of a distribution), line charts (for trends over time), and bar charts or pie charts (for categorical data proportions).

Insights: Visualization can reveal correlations (e.g., an upward trend in a scatter plot suggests a positive correlation), identify outliers (points far from others), and communicate findings clearly. It's an essential part of both data analysis and presenting results, making the data's story accessible.`,

  'Feature Engineering': `Definition: Feature engineering is the process of creating, transforming, or selecting variables (features) from raw data to improve model performance. It often involves domain knowledge to construct features that make patterns more learnable by the model.

Examples: This could mean creating a new feature by combining others (e.g., converting date of birth into age, or combining width and height into area), transforming features (e.g., taking the logarithm of a skewed distribution to reduce skewness), or encoding categorical data meaningfully.

Purpose: Effective feature engineering can significantly enhance a model's predictive power by providing it with more relevant information. It's considered a key step in the machine learning pipeline — better features can often outperform more complex algorithms.`,

  'Feature Selection': `Definition: Feature selection involves identifying and keeping the most relevant features in your dataset while removing those that are redundant or irrelevant. The goal is to simplify the model without sacrificing accuracy, and often to improve generalization.

Techniques: Methods include filter techniques (e.g., removing features with low variance or high correlation to others), wrapper methods (testing subsets of features to see which yields the best model performance), and embedded methods (where algorithms select features inherently, such as Lasso regression driving some coefficients to zero).

Benefits: By reducing the feature set, models become less complex and less prone to overfitting, and they run faster. Focusing on important features can also improve interpretability. For instance, using feature selection, we ensure the model only uses the most meaningful variables, which often leads to better generalization.`,

  'Regression': `Concept: Regression is a type of supervised learning used for predicting continuous numeric outcomes. A regression model learns the relationship between input features and a continuous target variable (e.g., predicting house prices given size, location, etc.).

Linear Regression: The simplest form is linear regression, which fits a straight line (or hyperplane for multiple features) through the data that best estimates the target by minimizing error (often measured by Mean Squared Error (MSE)). The line is defined by an equation like y = mx + b in simple linear regression, where m is the slope and b the intercept.

Use Cases & Metrics: Examples of regression tasks include forecasting sales, estimating salaries, or any prediction of a number. Performance is evaluated with metrics such as MSE, Root MSE, or R-squared (which indicates the proportion of variance in the target explained by the model).`,

  'Classification': `Concept: Classification is a supervised learning task where the goal is to predict a discrete category or class label for each example. The model learns from labeled data (examples with known classes) how to assign new examples to one of the known categories.

Examples: Spam detection (classify emails as "spam" or "not spam"), image recognition (classify images into categories), and medical diagnosis (e.g., classify tumors as benign or malignant) are all classification problems.

Algorithms & Metrics: Common classification algorithms include logistic regression, decision trees, support vector machines, k-nearest neighbors, and naive Bayes, among others. Model performance is often evaluated using metrics like accuracy (overall correctness), precision and recall (especially important for imbalanced classes), and F1-score (harmonic mean of precision and recall). A confusion matrix is used to visualize performance by showing true vs. predicted classifications.`,

  'Logistic Regression': `About: Logistic regression is a popular algorithm for binary classification (and can be extended to multiclass problems). Despite its name, it's actually a classification technique, not a regression technique.

How It Works: Logistic regression models the probability of the default class (e.g., "positive" class) using a logistic (sigmoid) function. It takes a linear combination of input features and passes it through the sigmoid, which outputs a value between 0 and 1, interpretable as a probability. Predictions are made by thresholding this probability (commonly at 0.5) to decide between classes.

Usage: If the probability is above the threshold, the instance is classified as the positive class; otherwise as the negative class. Logistic regression is widely used for its simplicity and effectiveness on linearly separable data, and its outputs (probabilities) are useful for understanding model confidence.`,

  'Decision Trees': `Structure: A decision tree is a tree-structured model for decision making. Each internal node represents a decision based on a feature (a test on an attribute, e.g., "is temperature > 30°C?"), each branch represents an outcome of that decision (e.g., yes or no), and each leaf node represents a predicted outcome or class label.

Usage: Decision trees can perform both classification and regression. For classification, a leaf might be a class (like "spam" or "not spam"); for regression, a leaf might contain a numeric prediction (like a price).

Advantages & Challenges: They are easy to interpret (you can follow the path to see why a prediction was made) and handle both numerical and categorical data. However, trees can overfit if grown too deep (perfectly fitting training data but not generalizing). Techniques like pruning (trimming the tree depth) or setting minimum leaf sizes are used to prevent overfitting.`,

  'Ensemble Methods': `Idea: Ensemble methods improve predictive performance by combining multiple models (often called "weak learners") rather than relying on a single model. The fundamental principle is that a group of models can outperform a single model, especially if the models complement each other's errors.

Examples:

Bagging (Bootstrap Aggregating): e.g., Random Forest which combines many decision trees. Each tree is trained on a random subset of the data, and their outputs are averaged (regression) or majority-voted (classification).

Boosting: e.g., AdaBoost, XGBoost, where models are trained sequentially. Each new model focuses on correcting the mistakes of the previous ones, and then they are combined for the final prediction.

Stacking: combining different types of models by training a meta-model on their outputs.

Benefit: Ensembles typically achieve higher accuracy and more robustness than individual models, often reducing overfitting by averaging out errors of individual learners.`,

  'Support Vector Machines': `Objective: SVMs are supervised learning models used for classification (and regression). They work by finding the optimal hyperplane that best separates data points of different classes in the feature space. The optimal hyperplane maximizes the margin – the distance between the hyperplane and the nearest data points of each class (called support vectors).

Kernels: SVM can efficiently perform non-linear classification using kernel functions (e.g., polynomial, radial basis function). The kernel trick allows SVMs to operate in a high-dimensional (even infinite-dimensional) feature space without explicitly computing coordinates in that space, enabling separation of complex datasets.

Characteristics: SVMs are effective in high-dimensional spaces and are relatively memory efficient (since they use only support vectors for decisions). However, they can be sensitive to the choice of kernel and parameters, and they may not scale well to very large datasets.`,

  'K-Nearest Neighbors': `Mechanism: KNN is an instance-based learning algorithm (a type of lazy learning because it doesn't train a model explicitly). To classify a new data point, KNN finds the k training examples closest to the point (using a distance metric like Euclidean distance) and assigns the majority class among those neighbors. For regression, it averages the values of the neighbors.

Characteristics:

It's simple and intuitive – "birds of a feather flock together." Similar data points are likely to have similar outcomes.

KNN can handle multi-class classification and regression.

Considerations: Choosing k is important: k=1 can be noisy (overfitting to the nearest point), whereas a very large k can wash out useful patterns (underfitting). KNN can be computationally expensive at prediction time (needs to compute distances to all training points) and doesn't produce a model that's easy to interpret beyond the stored examples.`,

  'Naive Bayes': `Principle: Naive Bayes is a family of probabilistic classifiers based on applying Bayes' Theorem with a strong independence assumption between features. "Naive" refers to the assumption that every feature is independent of the others given the class label, which is rarely true in practice but simplifies the computations.

How It Works: It calculates the posterior probability of each class given the input features using Bayes' Theorem: P(Class | Features) ∝ P(Features | Class) * P(Class). The classifier predicts the class with the highest posterior probability.

Pros & Cons: Naive Bayes is extremely fast and efficient with high-dimensional data and is particularly known for text classification tasks (like spam filtering or sentiment analysis) due to the independence assumption approximating reality when features are word counts. It performs surprisingly well even if the independence assumption is violated, but if features are heavily correlated, performance may degrade.`,

  'Clustering': `Concept: Clustering is an unsupervised learning approach that involves grouping a set of data points into clusters such that points in the same cluster are more similar to each other than to those in other clusters. It finds intrinsic patterns or groupings in data without predefined labels.

Algorithms:

K-Means: partitions data into k clusters by iteratively assigning points to the nearest cluster centroid and updating centroids. It aims to minimize within-cluster variance.

Hierarchical Clustering: builds a hierarchy of clusters either agglomeratively (bottom-up merging) or divisively (top-down splitting).

DBSCAN: a density-based method that can find arbitrarily shaped clusters and identify outliers (noise) based on density of points.

Use Cases: Clustering is used in customer segmentation, anomaly detection, grouping similar documents or images, etc. It's exploratory – results need interpretation since there are no ground truth labels.`,

  'Dimensionality Reduction': `Purpose: Dimensionality reduction techniques aim to reduce the number of features (dimensions) in a dataset while preserving as much important information (variance) as possible. High-dimensional data can be problematic (curse of dimensionality), and simplifying it can make models faster and reduce overfitting.

Techniques:

Principal Component Analysis (PCA): A popular method that transforms the original features into a new set of principal components which are linear combinations of the original features. These components are orthogonal and ranked by how much variance in the data they explain.

t-SNE, UMAP: Non-linear techniques primarily used for visualization of high-dimensional data in 2D or 3D.

Benefits: Reduced-dimensional data means simpler models, faster training, and often improved generalization by eliminating noisy or redundant features. For example, PCA can compress data with minimal loss of information by keeping only the top components that account for most variance.`,

  'Model Evaluation & Validation': `Train/Test Split: To assess a model's performance on unseen data, the dataset is typically split into a training set (to train the model) and a test set (to evaluate it). This helps detect overfitting — if a model performs well on training but poorly on test, it hasn't generalized well.

Cross-Validation: Techniques like k-fold cross-validation provide a more robust evaluation by dividing data into k subsets, training the model k times each on a different (k-1)/k portion and validating on the remaining 1/k. This way, every data point gets to be in a validation set once, and the average performance across folds is measured.

Metrics: Evaluation metrics depend on the task:

For regression: MSE, MAE (Mean Absolute Error), R^2, etc.

For classification: accuracy, precision, recall, F1-score, and AUC-ROC (area under the ROC curve) which indicates the trade-off between true positive rate and false positive rate.

Model Tuning: Proper validation helps in selecting models and tuning hyperparameters (e.g., choosing regularization strength, tree depth, etc.) to avoid overfitting the test set. Often a separate validation set or using cross-validation is recommended for hyperparameter tuning, reserving the test set as a truly unseen final evaluation.`,

  'Overfitting vs Underfitting': `Overfitting: Occurs when a model learns the training data too well, including its noise and outliers, losing the ability to generalize. An overfit model has high training accuracy but low test accuracy. It's often a result of model complexity – too many parameters or too flexible a model that can model random fluctuations.

Underfitting: Occurs when a model is too simple to capture the underlying pattern in the data. It performs poorly on both training and test data. This could happen if the model has too few parameters or the training time is insufficient. Underfit models have high bias (simplistic assumptions).

Bias-Variance Tradeoff: Overfitting is associated with high variance (model output highly sensitive to small fluctuations in training data), while underfitting is associated with high bias (model too rigid). The goal is to find the right complexity that balances bias and variance.

Remedies: To combat overfitting, one can simplify the model, use regularization, or gather more data. To address underfitting, one might increase model complexity (add features, use a more sophisticated algorithm) or ensure adequate training.`,

  'Regularization': `Concept: Regularization introduces an additional penalty term to the model's loss function to discourage overly complex models. By penalizing large weights or overly complex structures, regularization helps prevent overfitting.

Techniques:

L1 Regularization (Lasso): Adds a penalty equal to the absolute value of weights. It tends to drive many weights to zero, effectively performing feature selection.

L2 Regularization (Ridge): Adds a penalty equal to the square of weights. It generally results in smaller weights but rarely zeroes them out.

Dropout (in neural networks): Randomly dropping out a fraction of neurons during training to prevent co-adaptation, which also serves as regularization.

Early Stopping: Halting training when performance on a validation set stops improving, to prevent over-training on the noise.

Effect: Regularization usually improves generalization by simplifying the model's effective complexity. However, too strong regularization can lead to underfitting (model is oversimplified). The regularization strength is typically controlled by a hyperparameter.`,

  'Optimization Algorithms': `Role in ML: Training a machine learning model often involves defining a loss function (which measures error between predictions and true values) and then using an optimization algorithm to find the model parameters that minimize this loss.

Gradient Descent: The most common optimization approach; it iteratively adjusts parameters in the opposite direction of the gradient of the loss function with respect to those parameters (i.e., moving "downhill" on the error surface). Variants include:

Batch Gradient Descent: uses the entire training set to compute gradients for each update.

Stochastic Gradient Descent (SGD): uses one (or a few) training example(s) per update, introducing noise but often converging faster.

Mini-batch Gradient Descent: a compromise that uses batches of, say, 32 or 64 samples per update.

Advanced Optimizers: There are more sophisticated algorithms like Adam, RMSprop, etc., which adapt learning rates and momentum terms to speed up convergence.

Learning Rate: A crucial hyperparameter that determines the step size in each iteration of gradient descent. If it's too high, the optimization may diverge or oscillate; if too low, training becomes very slow or can get stuck in a local minimum.`,

  'Neural Networks': `Inspiration: Neural networks (artificial neural networks, ANNs) are inspired by the human brain. They consist of interconnected nodes (neurons) organized in layers. Each neuron takes input from the previous layer, applies weights and a bias, and passes the result through an activation function (like ReLU, sigmoid, or tanh) to produce an output.

Layers: Typically organized into an input layer (features of the data), one or more hidden layers, and an output layer. A network with multiple hidden layers is a deep neural network (see Deep Learning below).

Learning: Neural networks learn complex patterns by adjusting weights through a process called backpropagation, which calculates the gradient of the loss function with respect to each weight (using the chain rule) and updates the weights via optimization (e.g., gradient descent). This allows the network to gradually improve its predictions.

Capabilities: Neural nets are very powerful – they can approximate complex non-linear functions and have achieved state-of-the-art results in many domains (vision, speech, etc.). However, they often require large amounts of data and computational resources to train, and their internal workings can be hard to interpret.`,

  'Deep Learning': `What Makes it "Deep": Deep learning refers to machine learning using neural networks with multiple layers (hence "deep"). These deep neural networks can automatically learn hierarchical feature representations from data – each layer captures increasingly abstract features.

Key Architectures:

Convolutional Neural Networks (CNNs): Specialized for grid-like data such as images, where they use convolutional layers to automatically learn spatial hierarchies of features (edges, shapes, objects) – very effective for image recognition.

Recurrent Neural Networks (RNNs) and LSTMs: Designed for sequence data (like time series or natural language) to capture temporal dependencies.

Transformers: Modern architecture (e.g., used in NLP) using self-attention mechanisms to handle sequential data more efficiently than RNNs in many cases.

Requirements: Deep learning models typically need large datasets and high computational power (GPUs/TPUs) for training. They often use advanced optimizers (Adam, etc.) and regularization techniques (dropout, batch normalization) to aid training.

Strengths: They excel at tasks like image classification, speech recognition, and natural language processing, where they have dramatically improved the state of the art by automatically learning complex features directly from raw data.`,

  'Reinforcement Learning': `Framework: In reinforcement learning (RL), an agent learns to make decisions by interacting with an environment. Instead of labeled examples of correct outputs, the agent receives rewards (or penalties) as feedback for its actions. The objective is to learn a policy (a strategy of choosing actions) that maximizes cumulative reward.

Trial and Error: RL is essentially learning by trial-and-error. The agent tries actions in different states and learns from the consequences (reward signals) which actions are beneficial. Over time, it gives more preference to actions that lead to higher rewards.

Key Concepts:

State: the current situation of the agent (e.g., positions on a game board).

Action: a choice the agent can make in a state (e.g., move left/right).

Reward: feedback from the environment (e.g., +1 for a win, -1 for a loss).

Policy: the agent's strategy, a mapping from states to actions.

Value Function: a prediction of future rewards from a state (used in some RL algorithms to evaluate how good a state or action is).

Applications: RL has been famously applied to games (Chess, Go, video games) where agents learn strategies that surpass human performance (e.g., AlphaGo). It's also used in robotics (learning to walk or manipulate objects) and resource management tasks, among others.`,

  'Natural Language Processing': `Definition: NLP is a field of AI that focuses on enabling computers to interpret, understand, and generate human language. It combines linguistics and machine learning to process text and speech data.

Tasks: Common NLP tasks include:

Text Classification: e.g., spam detection, sentiment analysis (determining if a review is positive or negative).

Machine Translation: translating text from one language to another (e.g., English to French).

Named Entity Recognition: identifying entities like people, organizations, dates in text.

Language Generation: producing text, such as chatbots or summarization.

Techniques: NLP often involves steps like tokenization (splitting text into words or subwords), stop-word removal, stemming/lemmatization (normalizing words to their root forms), and representing text in numeric form via embeddings or vectorization (e.g., TF-IDF or word embeddings). Modern NLP heavily uses deep learning models (like Transformers in GPT or BERT) for state-of-the-art performance in language understanding.`,

  'Time Series Analysis': `Nature of Data: Time series data consists of observations recorded over time (e.g., daily stock prices, monthly sales, sensor readings). What makes time series unique is that order and temporal dependencies matter – the value at one time can depend on previous values.

Analysis Goals: Analysts look for patterns such as trends (long-term increase/decrease), seasonality (regular periodic fluctuations, e.g., higher sales every December), and cycles. Time series analysis often aims to model these components to understand the data and to make forecasts.

Forecasting: Time series forecasting involves using historical data to predict future values. Models like ARIMA (Auto-Regressive Integrated Moving Average) and exponential smoothing methods are classical approaches. More recent approaches include using RNNs or Prophet (a model by Facebook) for forecasting.

Applications: Forecasting is vital in finance (stock prices, economic indicators), operations (demand forecasting, inventory management), weather prediction, etc. A good model will capture the structure in time series data (like seasonal patterns) to make accurate predictions. Understanding concepts like autocorrelation (correlation of a signal with a delayed copy of itself) is important in time series, as past values often influence future values.`,
};
