import math
import random
from typing import List

import numpy as np
from scipy.linalg import cholesky

def rnormal(mu: np.array, Sigma: np.array) -> np.array:
    k = len(mu)
    A = cholesky(Sigma, lower=True)
    assert(np.isclose(A.dot(A.T), Sigma).all())
    z = np.random.normal(size=k)
    return mu + A @ z

def is_positive_semidefinite(A: np.array) -> float:
    k = len(A)
    assert(k == len(A[0]))
    for _ in range(1000):
        x = np.random.normal(size=k)
        if x.T.dot(A).dot(x) < 0:
            return False
    else:
        return True

def is_positive_definite(A: np.array) -> float:
    k = len(A)
    assert(k == len(A[0]))
    for _ in range(1000):
        x = np.random.normal(size=k)
        if x.T.dot(A).dot(x) <= 0:
            return False
    else:
        return True

def posterior_niw(  # need
        mu: np.array,
        lamb: float,
        Psi: np.array,
        nu: float,
        ys: List[np.array]
):
    n = len(ys)
    ybar = sum(ys) / n
    S = sum(np.outer((y - ybar), (y - ybar).T) for y in ys)
    mu_n = (lamb * mu + n * ybar) / (lamb + n)
    lamb_n = lamb + n
    nu_n = nu + n
    M = (lamb * n) / (lamb + n) * np.outer(ybar - mu, (ybar - mu).T)
    Psi_n = Psi + S + M
    return mu_n, lamb_n, Psi_n, nu_n

def rwishart(V: np.array, n: int) -> np.array:  # need
    p = len(V)
    mus = np.zeros(shape=p)
    gs = [rnormal(mus, V) for _ in range(n)]
    # each g is a column of G
    G = np.vstack(gs).T
    return G @ G.T

def rinvwishart(Psi: np.array, nu: float) -> np.array:  # need
    p = len(Psi)
    assert p == len(Psi[0])
    assert nu > p - 1
    V = np.linalg.inv(Psi)
    X = rwishart(V, nu)
    return np.linalg.inv(X)


def rniw(  # need
        mu0: np.array,
        lamb: float,
        Psi: np.array,
        nu: float,
):
    Sigma = rinvwishart(Psi, nu)
    mu = rnormal(mu0, 1 / lamb * Sigma)
    return mu, Sigma


def rniw_test1():
    p = 2
    true_mu = np.zeros(shape=p)
    # true_Sigma = 1/10 * np.eye(p)
    A = np.array([[1, 2], [2, 1]])
    true_Sigma = A @ A.T
    ys = [rnormal(true_mu, true_Sigma) for _ in range(100)]

    ys = ys[:100]
    plt.scatter([y[0] for y in ys], [y[1] for y in ys], label='data')
    mu_n, lamb_n, Psi_n, nu_n = posterior_niw(
        mu = np.zeros(p),
        lamb = 0.01,
        Psi = np.eye(p),
        nu = p,
        ys = ys
    )
    posteriors = [rniw(mu_n, lamb_n, Psi_n, nu_n) for _ in range(1000)]
    posterior_samples = [rnormal(mu, Sigma) for (mu, Sigma) in posteriors]
    plt.scatter(
        [mu[0] for (mu, Sigma) in posteriors],
        [mu[1] for (mu, Sigma) in posteriors],
        s=0.1,
        label='posterior'
    )
    plt.scatter(
        [y[0] for y in posterior_samples],
        [y[1] for y in posterior_samples],
        s=0.1,
        label='posterior samples'
    )
    plt.legend()
    plt.show()
