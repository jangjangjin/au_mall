const style = document.createElement("style");
style.textContent = `
.loading-spinner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

nav ul {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

nav ul.loaded {
  opacity: 1;
}
`;
document.head.appendChild(style);

function showLoading() {
  document.getElementById("loading-spinner").style.display = "flex";
  document.querySelector("nav ul").classList.remove("loaded");
}

function hideLoading() {
  document.getElementById("loading-spinner").style.display = "none";
  document.querySelector("nav ul").classList.add("loaded");
}

function updateMenuBasedOnAuth(user) {
  const logoutItem = document.querySelector("#logout-button").parentElement;
  const loginItem = document.querySelector("nav ul li:nth-child(2)");
  const signupItem = document.querySelector("nav ul li:nth-child(4)");

  if (user) {
    logoutItem.style.display = "block";
    loginItem.style.display = "none";
    signupItem.style.display = "none";
  } else {
    logoutItem.style.display = "none";
    loginItem.style.display = "block";
    signupItem.style.display = "block";
  }
}

// 페이지 로드 시 실행
window.onload = function () {
  showLoading(); // 로딩 표시

  // 1초 후에 로딩을 숨기고 메뉴 업데이트
  setTimeout(() => {
    firebase.auth().onAuthStateChanged(function (user) {
      updateMenuBasedOnAuth(user);
      hideLoading();
    });
  }, 1000);
};

// 로그아웃 이벤트 리스너
document.getElementById("logout-button").addEventListener("click", function () {
  firebase
    .auth()
    .signOut()
    .then(() => {
      alert("로그아웃 성공!");
      window.location.href = "../index.html";
    })
    .catch((error) => {
      alert("로그아웃 실패: " + error.message);
      console.error("로그아웃 중 오류 발생:", error);
    });
});
