function toggleMenu() {
  const navUl = document.querySelector('nav ul');
  navUl.classList.toggle('show');
}

firebase.auth().onAuthStateChanged((user) => {
    const loginNavItem = document.getElementById("login-link");
    const signupNavItem = document.getElementById("signup-link");
    const logoutNavItem = document.getElementById("logout-button");
  
    if (user) {
      console.log("로그인된 사용자:", user);
      loginNavItem.style.display = "none"; // 로그인 버튼 숨김
      signupNavItem.style.display = "none"; // 회원가입 버튼 숨김
      logoutNavItem.style.display = "block"; // 로그아웃 버튼 보임
    } else {
      console.log("사용자가 로그인되지 않음.");
      loginNavItem.style.display = "block"; // 로그인 버튼 보임
      signupNavItem.style.display = "block"; // 회원가입 버튼 보임
      logoutNavItem.style.display = "none"; // 로그아웃 버튼 숨김
    }
  });
  
  // 로그아웃 버튼 클릭 처리
  document.getElementById("logout-button").addEventListener("click", function () {
    firebase.auth().signOut().then(() => {
      alert("로그아웃 성공!");
      window.location.href = "./index.html";
    }).catch((error) => {
      alert("로그아웃 실패: " + error.message);
      console.error("로그아웃 중 오류 발생:", error);
    });
  });
  
  // 슬라이더 기능, 상품 리스트 추가 코드 등...
  