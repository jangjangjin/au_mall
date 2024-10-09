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

// Firebase에서 로그인 상태 변화를 감지
window.onload = function() {
firebase.auth().onAuthStateChanged(function(user) {
  updateMenuBasedOnAuth(user);
});
};