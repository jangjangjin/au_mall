// Firebase에서 로그인 상태 변화를 감지
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // 리뷰를 가져올 참조 생성
    const reviewsRef = firebase.database().ref("reviews");

    // 현재 사용자의 리뷰만 가져오기
    reviewsRef
      .orderByChild("userId")
      .equalTo(user.uid)
      .on("value", (snapshot) => {
        const reviewsList = document.querySelector(".section ul");
        reviewsList.innerHTML = ""; // 기존 리뷰 목록 초기화

        if (!snapshot.exists()) {
          reviewsList.innerHTML =
            '<li class="no-reviews">작성한 리뷰가 없습니다.</li>';
          return;
        }

        // 날짜 포맷팅 함수
        const formatDate = (timestamp) => {
          const date = new Date(timestamp);
          return date.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
        };

        // 리뷰 데이터를 배열로 변환하고 날짜순으로 정렬
        const reviews = [];
        snapshot.forEach((childSnapshot) => {
          reviews.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });

        // 날짜 기준 내림차순 정렬 (최신순)
        reviews.sort((a, b) => b.timestamp - a.timestamp);

        // 별점을 별 이모지로 변환하는 함수
        const getStarRating = (rating) =>
          "★".repeat(rating) + "☆".repeat(5 - rating);

        // 각 리뷰에 대한 HTML 요소 생성
        reviews.forEach((review) => {
          // 제품 정보를 가져오기 위한 참조
          firebase
            .database()
            .ref("products/" + review.productId)
            .once("value")
            .then((productSnapshot) => {
              const product = productSnapshot.val();
              const productName = product ? product.name : "삭제된 상품";

              const li = document.createElement("li");
              li.className = "review-item";
              li.innerHTML = `
              <div class="review-header">
                <span class="review-product">${productName}</span>
                <span class="review-rating">${getStarRating(
                  review.rating
                )}</span>
                <span class="review-date">${formatDate(review.timestamp)}</span>
              </div>
              <div class="review-content">
                <p>${review.review}</p>
              </div>
            `;
              reviewsList.appendChild(li);
            });
        });
      });
  }
  if (user) {
    console.log("사용자 로그인 상태 감지:", user); // 사용자 로그인 확인
    const userRef = firebase.database().ref("users/" + user.uid);

    userRef
      .once("value")
      .then((snapshot) => {
        const userData = snapshot.val();
        console.log("사용자 데이터:", userData); // 사용자 데이터 확인
        document.querySelector(".profile-info h3").textContent =
          userData.username || "닉네임 없음";
        document.querySelector(".profile-info p").textContent =
          "이메일: " + user.email;

        if (user.photoURL) {
          document.querySelector(".profile-img").src = user.photoURL;
        }
      })
      .catch((error) => {
        console.error("사용자 데이터 가져오기 중 오류 발생:", error);
      });
  } else {
    console.log("사용자 로그인되지 않음"); // 사용자 비로그인 상태
    document.querySelector(".profile-info h3").textContent = "로그인하지 않음";
    document.querySelector(".profile-info p").textContent = "이메일: 없음";
  }
});

// 프로필 이미지 변경 버튼 클릭 이벤트 처리
document.getElementById("edit-profile").addEventListener("click", function () {
  document.getElementById("profile-image-input").click();
});

// 파일 선택 후 이미지 업로드 및 프로필 업데이트
document
  .getElementById("profile-image-input")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const user = firebase.auth().currentUser;
      const storageRef = firebase.storage().ref("profile_images/" + user.uid);

      console.log("이미지 업로드 시작"); // 이미지 업로드 시작 로그

      // Firebase Storage에 이미지 업로드
      const uploadTask = storageRef.put(file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // 업로드 상태 변화 감지 (progress 표시 등 추가 가능)
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("업로드 진행률: " + progress + "%");
        },
        (error) => {
          console.error("이미지 업로드 중 오류 발생:", error);
        },
        () => {
          // 업로드 완료 후 다운로드 URL 가져오기
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            console.log("다운로드 URL 가져오기 성공:", downloadURL); // 다운로드 URL 로그
            // 프로필 이미지 업데이트
            user
              .updateProfile({
                photoURL: downloadURL,
              })
              .then(() => {
                console.log("프로필 이미지 업데이트 성공"); // 프로필 이미지 업데이트 성공 로그
                document.querySelector(".profile-img").src = downloadURL;
                alert("프로필 이미지가 성공적으로 변경되었습니다.");
              })
              .catch((error) => {
                console.error("프로필 이미지 업데이트 중 오류 발생:", error);
              });
          });
        }
      );
    } else {
      console.log("선택된 파일이 없습니다."); // 파일 미선택 로그
    }
  });

// 주문 확인하기 버튼 클릭 이벤트 처리
document.getElementById("view-orders").addEventListener("click", function () {
  window.location.href = "order-history.html";
});

document
  .getElementById("update-credentials-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    console.log("비밀번호 변경 폼 제출됨"); // 폼 제출 확인

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.");
      console.log("새 비밀번호와 확인 비밀번호가 일치하지 않음"); // 비밀번호 불일치 로그
      return;
    }

    const user = firebase.auth().currentUser;
    console.log("사용자 인증 상태 확인:", user); // 사용자 인증 확인

    if (!user) {
      console.error("사용자 인증되지 않음"); // 로그인 상태 문제 로그
      alert("로그인된 사용자만 비밀번호를 변경할 수 있습니다.");
      return;
    }

    const credentials = firebase.auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    console.log("재인증 시도 중"); // 재인증 시작 로그

    // 기존 비밀번호 확인을 위해 재인증
    user
      .reauthenticateWithCredential(credentials)
      .then(() => {
        console.log("재인증 성공"); // 재인증 성공 로그

        // 비밀번호 업데이트 시도
        user
          .updatePassword(newPassword)
          .then(() => {
            console.log("비밀번호 변경 성공"); // 비밀번호 변경 성공 로그
            alert("비밀번호가 성공적으로 변경되었습니다.");
          })
          .catch((error) => {
            console.error("비밀번호 변경 중 오류 발생:", error); // 비밀번호 변경 중 에러 로그
            alert(
              "비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
            );
          });
      })
      .catch((error) => {
        console.error("재인증 실패:", error); // 재인증 실패 로그
        alert("기존 비밀번호가 올바르지 않습니다.");
      });
  });
// Firebase에서 사용자의 문의 내역을 가져와서 표시하는 기능
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // 문의 내역을 가져올 참조 생성
    const inquiryRef = firebase.database().ref("inquiries");

    // 현재 사용자의 문의 내역만 가져오기
    inquiryRef
      .orderByChild("userId")
      .equalTo(user.uid)
      .on("value", (snapshot) => {
        const inquiriesList = document.getElementById("inquiries-list");
        inquiriesList.innerHTML = ""; // 기존 내용 초기화

        if (!snapshot.exists()) {
          inquiriesList.innerHTML =
            '<p class="no-inquiries">작성한 문의가 없습니다.</p>';
          return;
        }

        // 날짜 포맷팅 함수
        const formatDate = (dateString) => {
          const date = new Date(dateString);
          return date.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
        };

        // 상태에 따른 스타일 클래스 반환 함수
        const getStatusClass = (status) => {
          switch (status) {
            case "pending":
              return "status-pending";
            case "in-progress":
              return "status-progress";
            case "completed":
              return "status-completed";
            default:
              return "";
          }
        };

        // 상태 한글 변환 함수
        const getStatusText = (status) => {
          switch (status) {
            case "pending":
              return "접수됨";
            case "in-progress":
              return "답변 중";
            case "completed":
              return "답변 완료";
            default:
              return "알 수 없음";
          }
        };

        // 스냅샷의 각 문의 내역을 순회하며 HTML 엘리먼트 생성
        const inquiries = [];
        snapshot.forEach((childSnapshot) => {
          const inquiry = childSnapshot.val();
          inquiries.push({
            id: childSnapshot.key,
            ...inquiry,
          });
        });

        // 날짜순으로 정렬 (최신순)
        inquiries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        inquiries.forEach((inquiry) => {
          const details = document.createElement("details");
          details.className = "inquiry-item";

          const summary = document.createElement("summary");
          summary.className = "inquiry-summary";
          summary.innerHTML = `
                        <span class="inquiry-date">${formatDate(
                          inquiry.timestamp
                        )}</span>
                        <span class="inquiry-title">${inquiry.message.substring(
                          0,
                          30
                        )}${inquiry.message.length > 30 ? "..." : ""}</span>
                        <span class="inquiry-status ${getStatusClass(
                          inquiry.status
                        )}">${getStatusText(inquiry.status)}</span>
                    `;

          const content = document.createElement("div");
          content.className = "inquiry-content";
          content.innerHTML = `
                        <div class="inquiry-message">
                            <h4>문의 내용</h4>
                            <p>${inquiry.message}</p>
                        </div>
                        ${
                          inquiry.answer
                            ? `
                            <div class="inquiry-answer">
                                <h4>답변</h4>
                                <p>${inquiry.answer}</p>
                                <span class="answer-date">답변일: ${formatDate(
                                  inquiry.answerTimestamp
                                )}</span>
                            </div>
                        `
                            : '<p class="no-answer">아직 답변이 등록되지 않았습니다.</p>'
                        }
                    `;

          details.appendChild(summary);
          details.appendChild(content);
          inquiriesList.appendChild(details);
        });
      });
  }
});
