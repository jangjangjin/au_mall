document
  .getElementById("login-form")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // 기본 폼 제출 방지

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Firebase Authentication을 사용하여 로그인
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // 로그인 성공
        const user = userCredential.user;
        alert("로그인 성공!");
        // 로그인 후 할 작업 (예: 사용자 페이지로 이동)
        window.location.href = "../index.html";
      })
      .catch((error) => {
        // 로그인 실패
        alert("로그인 실패: 이메일 또는 비밀번호가 잘못되었습니다.");
        console.error("로그인 중 오류 발생:", error);
      });
  });

// Firebase Google 로그인 설정
const googleProvider = new firebase.auth.GoogleAuthProvider();

document
  .getElementById("google-login-button")
  .addEventListener("click", function () {
    firebase
      .auth()
      .signInWithPopup(googleProvider)
      .then((result) => {
        // 로그인 성공
        const user = result.user;
        alert("구글 로그인 성공!");
        window.location.href = "../index.html";
      })
      .catch((error) => {
        // 로그인 실패
        alert("구글 로그인 실패: " + error.message);
        console.error("구글 로그인 중 오류 발생:", error);
      });
  });

// 회원가입 페이지로 이동
document.getElementById("signup-button").addEventListener("click", function () {
  window.location.href = "/html/signup.html";
});