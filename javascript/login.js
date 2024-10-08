// 로그인 상태가 유지되는지 확인하고 리디렉션
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log("로그인된 사용자:", user);
    window.location.href = "../index.html";
  } else {
    console.log("사용자가 로그인되지 않음.");
  }
});

document.getElementById("login-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      alert("로그인 성공!");  // 로그인 성공 메시지 표시
      saveUserData(user, () => {
        window.location.href = "../index.html";
      });
    })
    .catch((error) => {
      alert("로그인 실패: 이메일 또는 비밀번호가 잘못되었습니다.");
      console.error("로그인 중 오류 발생:", error);
    });
});

// 사용자 데이터를 Firebase Realtime Database에 저장하는 함수
function saveUserData(user, callback) {
  const userRef = firebase.database().ref('users/' + user.uid);
  userRef.set({
    email: user.email,
    username: user.displayName || 'Anonymous'
  }).then(() => {
    if (callback) callback();
  }).catch((error) => {
    console.error("사용자 데이터 저장 중 오류 발생:", error);
  });
}

// Firebase Google 로그인 설정
const googleProvider = new firebase.auth.GoogleAuthProvider();

document.getElementById("google-login-button").addEventListener("click", function () {
  firebase.auth().signInWithPopup(googleProvider)
    .then((result) => {
      const user = result.user;
      alert("로그인 성공!");  // 로그인 성공 메시지 표시
      saveUserData(user, () => {
        window.location.href = "../index.html";
      });
    })
    .catch((error) => {
      alert("구글 로그인 실패: " + error.message);
      console.error("구글 로그인 중 오류 발생:", error);
    });
});

// 회원가입 페이지로 이동
document.getElementById("signup-button").addEventListener("click", function () {
  window.location.href = "./signup.html";
});
