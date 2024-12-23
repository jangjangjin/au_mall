document
  .getElementById("signup-form")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // 기본 폼 제출 방지

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // 비밀번호 확인
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    // Firebase Authentication을 사용하여 회원가입
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // 회원가입 성공
        const user = userCredential.user;

        // 추가 사용자 정보를 데이터베이스에 저장
        const userData = {
          email: user.email,
          username: username, // 사용자 이름 저장
        };

        firebase
          .database()
          .ref("users/" + user.uid)
          .set(userData)
          .then(() => {
            alert("회원가입이 완료되었습니다!");
            document.getElementById("signup-form").reset(); // 폼 초기화
            window.location.href = "./login.html";
          })
          .catch((error) => {
            console.error("추가 사용자 정보 저장 중 오류 발생:", error);
          });
      })
      .catch((error) => {
        console.error("회원가입 중 오류 발생:", error);
        alert("회원가입 중 오류가 발생했습니다: " + error.message);
      });
  });
function onDOMLoaded() {}
fetch("footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer-container").innerHTML = data;
  })
  .catch((error) =>
    console.error("Footer를 로드하는 중 오류가 발생했습니다:", error)
  );

document.addEventListener("DOMContentLoaded", onDOMLoaded);
