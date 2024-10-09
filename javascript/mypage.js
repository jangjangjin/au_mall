  // Firebase에서 로그인 상태 변화를 감지
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // 사용자 정보가 있을 경우
            // Realtime Database에서 사용자 정보를 가져옴
            const userRef = firebase.database().ref('users/' + user.uid);
            userRef.once('value').then((snapshot) => {
                const userData = snapshot.val();
                console.log("User Data:", userData); // 사용자 데이터 확인
                document.querySelector('.profile-info h3').textContent = userData.username || '닉네임 없음';
                document.querySelector('.profile-info p').textContent = '이메일: ' + user.email;

                // 프로필 이미지가 설정되어 있으면 표시
                if (user.photoURL) {
                    document.querySelector('.profile-img').src = user.photoURL;
                }
            }).catch((error) => {
                console.error("사용자 데이터 가져오기 중 오류 발생:", error);
            });
        } else {
            // 사용자 정보가 없을 경우
            document.querySelector('.profile-info h3').textContent = '로그인하지 않음';
            document.querySelector('.profile-info p').textContent = '이메일: 없음';
        }
    });

    // 프로필 수정 버튼 클릭 이벤트 처리
    document.getElementById('edit-profile').addEventListener('click', function() {
        alert('프로필 수정 페이지로 이동합니다.');
        // 프로필 수정 페이지로 이동하는 코드 추가
        // window.location.href = 'edit-profile.html';
    });

    // 주문 확인하기 버튼 클릭 이벤트 처리
    document.getElementById('view-orders').addEventListener('click', function() {
        window.location.href = 'order-history.html';
    });

    // 아이디 및 비밀번호 수정 폼 제출 이벤트 처리
    document.getElementById('update-credentials-form').addEventListener('submit', function(event) {
        event.preventDefault();
        alert('아이디 및 비밀번호가 수정되었습니다.');
        // 아이디 및 비밀번호 수정 처리 코드 추가
    });
