// Standard Normal variate using Box-Muller transform.
function rnormal(mu, sigma){
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    var z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    return mu + sigma * z
}

function zeros(M, N) {
    // Make an M x N grid full of zeroes.
    return Array(M).fill(0).map(
        x => Array(N).fill(0)
    )
}

function eye(N){
    let I = zeros(N, N);
    for(var i = 0; i < N; i++){
        I[i][i] = 1;
    }
    return I;
}

function cholesky(A){
    const N = A.length;
    L = zeros(N, N);

    L[0][0] = Math.sqrt(A[0][0]);

    for (var i = 1; i < N; i++){
        L[i][0] = A[i][0] / L[0][0];
    }

    for (var i = 1; i < N; i++){
        var term = 0;
        for (var p = 0; p <= i - 1; p++){
            term += Math.pow(L[i][p], 2);
            //console.log("term:", j, k, term);
        }

        //console.log("sqrtand:", A[j][j] - term);
        L[i][i] = Math.sqrt(A[i][i] - term);

        for (var j = i + 1; j <= N - 1; j++){
            //console.log("starting on:", i, j);
            console.assert(i!=j);
            term = 0;
            for (var p = 0; p <= i - 1; p++){
                //console.log("square:", L[i][p] * L[j][p]);
                term += L[i][p] * L[j][p];
                //console.log("term:", term, i, j, p);
            }

            //console.log("A[j][j], term:", A[i][j], term);
            console.log(i, j);
            L[j][i] = (A[j][i] - term) / L[i][i];
            //console.log("Lij:", L[i][j]);
        }


    }

    return L;
}

function matrix_mult(A, B){
    Ma = A.length;
    Na = A[0].length;
    Mb = B.length;
    Nb = B[0].length;
    console.assert(Na == Mb, (A, B));
    AB = zeros(Ma, Nb);
    for(var i = 0; i < Ma; i ++){
        for(var j = 0; j < Nb; j ++){
            var acc = 0;
            for (var k = 0; k < Na; k++){
                acc += A[i][k] * B[k][j];
            }
            AB[i][j] = acc;
        }
    }
    return AB;
}

function transpose(A){
    M = A.length;
    N = A[0].length;
    AT = zeros(M, N);
    for(var i = 0; i < M; i ++){
        for(var j = 0; j < N; j ++){
            AT[j][i] = A[i][j];
        }
    }
    return AT;
}

function test_cholesky_identity(){
    A = zeros(5, 5);
    //console.log("A:", A);
    A[0][0] = 1;
    A[1][1] = 1;
    A[2][2] = 1;
    A[3][3] = 1;
    A[4][4] = 1;
    //console.log("A:", A);
    L = cholesky(A);
    LT = transpose(L);
    Ap = matrix_mult(L, LT);
    //console.log("L*LT:", Ap);
    console.log(matrix_eq(Ap, A));
    App = matrix_mult(LT, L);
    //console.log("LT*L:", App);
    console.log(matrix_eq(App, A));
}

function random_vector(k){
    let x = zeros(k, 1);
    for (var ip = 0; ip < k; ip ++){
        x[ip][0] = rnormal(0, 1);
    }
    return x;

}

function is_positive_semidefinite(A){
    let k = A.length;
    console.assert(k == A[0].length);
    for(var i = 0; i < 1000; i++){
        let x = random_vector(k);
        let xT = transpose(x);
        if (matrix_mult(matrix_mult(xT, A), x) < 0){
            return false;
        }
    }
    return true;
}

function random_matrix(M, N){
    var A = zeros(M, N);
    for(var i = 0; i <M; i++ ){
        for(var j = 0; j <N; j++ ){
            A[i][j] = rnormal(0, 1);
        }
    }
    return A;
}

function matrix_eq(A, B){
    if (!(A.length == B.length && A[0].length == B[0].length)){
        return false;
    }
    M = A.length;
    N = A[0].length;
    for(var i = 0; i <M; i++ ){
        for(var j = 0; j <N; j++ ){
            if (A[i][j] != B[i][j]) return false;
        }
    }
    return true;


}
function test_transpose(M, N){
    let A = random_matrix(M, N);
    let ans = transpose(transpose(A));
    //console.log(A)
    //console.log(ans)
    return matrix_eq(A, ans);
}


function test_cholesky_zeros(){
    var A = zeros(5, 5);
    for(var i = 0; i <5; i++ ){
        for(var j = 0; j <5; j++ ){
            A[i][j] = rnormal(0, 1);
        }
    }
    A = matrix_mult(transpose(A), A);
    //console.log("PSD:", is_positive_semidefinite(A));
    //console.log("A:", A);
    L = cholesky(A);
    console.log("L:", L);
    LT = transpose(L);
    ////console.log("LT:", LT);
    Ap = matrix_mult(L, LT);
    //console.log("Ap:", Ap);
    //console.log("L*LT:", Ap);
    //console.log(matrix_eq(Ap,A));
    var cum_ans = 0;
    for (var i = 0; i < 5; i++){
        for (var j = 0; j < 5; j++){
            let ans = Math.abs(A[i][j] - Ap[i][j]) < 10**-6
            console.log(i, j, ans);
            cum_ans += Math.abs(A[i][j] - Ap[i][j]);
        }
    }
    console.log("cum diff:", cum_ans);
    console.log("A:", A);
    console.log("Ap:", Ap);
    return matrix_eq(A, Ap);
}

function test_cholesky_example(){
    var A = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 10]
    ]
    M = matrix_mult(transpose(A), A);
    console.log(cholesky(M));
}
function test_matrix_multiplication(){
    A = random_matrix(3, 3);
    B = random_matrix(3, 3);
    C = random_matrix(3, 3);
    I = eye(3);
    //console.log(matrix_eq(matrix_mult(A, I), A));
    //console.log(matrix_eq(matrix_mult(I, A), A));

    let AB_C = matrix_mult(matrix_mult(A, B), C);
    let A_BC = matrix_mult(A, matrix_mult(B, C));
    //console.log(AB_C);
    //console.log(A_BC);
    console.log(matrix_eq(
        AB_C, A_BC

    ));
}

function invert(A){
    //Invert a 2x2 matrix
    console.assert(A.length == 2);
    console.assert(A[0].length == 2);
    let a = A[0][0];
    let b = A[0][1];
    let c = A[1][0];
    let d = A[1][1];
    let K = 1 / (a*d - b*c)
    let Ainv = [
        [K*1/d, K*(-b)],
        [K*(-c), K*(1/a)]
    ];
    return Ainv;

}

function sum(xs){
    return xs.reduce((x, y) => x + y)
}


function outer(xs, ys){
    console.log(xs, ys);
    console.assert(xs.length == ys.length);
    let n = ys.length;
    let A = zeros(n, n);
    xs.forEach((x, i) => {
        ys.forEach((y, j) => {
            A[i][j] = x * y;
            console.log(i, j, A[i][j]);
        })
    })
    return A;
}

function matrix_sum(A){
    return sum(A.map(row => sum(row)));
}

function matrix_add(A, B){
    return A.map((arow, i) => arow.map((a, j) => a + B[i][j]))
}

function vector_add(us, vs){
    return us.map((u, i) => u + vs[i])
}

function vector_sub(us, vs){
    return us.map((u, i) => u - vs[i])
}

function vector_scalar_mult(c, vs){
    return vs.map(v => c * v)
}

function matrix_scalar_mult(c, A){
    return A.map(row => row.map(a => c * a))
}

function posterior_niw(mu, lamb, Psi, nu, ys){
    n = ys.length;
    ybar = vector_scalar_mult(1 / n, ys.reduce((a, b) => vector_add(a, b)));
    console.log("ybar", ybar);
    S = (ys.map(y => (outer(vector_sub(y, ybar), vector_sub(y, ybar))))).reduce((a, b) => matrix_add(a, b));
    mu_n = vector_scalar_mult(1 / (lamb + n), vector_add(vector_scalar_mult(lamb, mu), vector_scalar_mult(n, ybar)));
    lamb_n = lamb + n
    nu_n = nu + n
    M = matrix_scalar_mult((lamb * n) / (lamb + n), outer(vector_sub(ybar, mu), vector_sub(ybar, mu)));
    Psi_n = matrix_add(matrix_add(Psi,  S),  M);
    return [mu_n, lamb_n, Psi_n, nu_n]
}
