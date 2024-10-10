function toggleMenu() {
  const navUl = document.querySelector('nav ul');
  navUl.classList.toggle('show');
}

// 로그인 상태에 따라 메뉴 항목 표시/숨기기
function updateMenuBasedOnAuth(user) {
  const logoutItem = document.querySelector('#logout-button').parentElement; // 로그아웃 li
  const loginItem = document.querySelector('nav ul li:nth-child(2)'); // 로그인 li
  const signupItem = document.querySelector('nav ul li:nth-child(4)'); // 회원가입 li


  if (user) {
      // 사용자가 로그인한 경우
      logoutItem.style.display = 'block'; // 로그아웃 표시
      loginItem.style.display = 'none'; // 로그인 숨기기
      signupItem.style.display = 'none'; // 회원가입 숨기기
  } else {
      // 사용자가 로그인하지 않은 경우
      logoutItem.style.display = 'none'; // 로그아웃 숨기기
      loginItem.style.display = 'block'; // 로그인 표시
      signupItem.style.display = 'block'; // 회원가입 표시
  }
}

document.getElementById("logout-button").addEventListener("click", function () {
  firebase.auth().signOut().then(() => {
    alert("로그아웃 성공!");
    window.location.href = "../index.html";
  }).catch((error) => {
    alert("로그아웃 실패: " + error.message);
    console.error("로그아웃 중 오류 발생:", error);
  });
});

// Firebase에서 로그인 상태 변화를 감지
window.onload = function() {
firebase.auth().onAuthStateChanged(function(user) {
  updateMenuBasedOnAuth(user);
});
};