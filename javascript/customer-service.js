// Firebase에서 문의사항을 저장할 참조 생성
const inquiryRef = firebase.database().ref("inquiries");

// 폼 요소 선택
const inquiryForm = document.getElementById("inquiry-form");

inquiryForm.addEventListener("submit", function (event) {
  event.preventDefault();
  console.log("문의 폼 제출됨"); // 폼 제출 확인 로그

  // 현재 로그인된 사용자 확인
  const user = firebase.auth().currentUser;

  if (!user) {
    console.log("로그인되지 않은 사용자"); // 비로그인 상태 로그
    alert("문의하기 전에 로그인해 주세요.");
    return;
  }

  // 폼 데이터 가져오기
  const name = document.getElementById("inquiry-name").value;
  const email = document.getElementById("inquiry-email").value;
  const message = document.getElementById("inquiry-message").value;

  // 현재 시간 가져오기
  const timestamp = new Date().toISOString();

  // Firebase에 저장할 데이터 객체 생성
  const inquiryData = {
    name: name,
    email: email,
    message: message,
    timestamp: timestamp,
    userId: user.uid, // 사용자 UID
    userEmail: user.email, // 사용자 이메일
    status: "pending", // 문의 상태 (pending, in-progress, completed 등)
    answer: null,
  };

  // Firebase에 데이터 저장
  inquiryRef
    .push(inquiryData)
    .then(() => {
      console.log("문의사항 저장 성공"); // 저장 성공 로그
      alert("문의사항이 성공적으로 접수되었습니다.");
      inquiryForm.reset(); // 폼 초기화
    })
    .catch((error) => {
      console.error("문의사항 저장 중 오류 발생:", error); // 저장 실패 로그
      alert(
        "문의사항 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
      );
    });
});

// 사용자의 문의 내역 조회 함수
function getUserInquiries(userId) {
  return inquiryRef
    .orderByChild("userId")
    .equalTo(userId)
    .once("value")
    .then((snapshot) => {
      const inquiries = [];
      snapshot.forEach((childSnapshot) => {
        inquiries.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
      return inquiries;
    });
}
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
