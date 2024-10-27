// Firebase에서 로그인 상태 변화를 감지
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        console.log("사용자 로그인 상태 감지:", user); // 사용자 로그인 확인
        const userRef = firebase.database().ref('users/' + user.uid);
        
        userRef.once('value').then((snapshot) => {
            const userData = snapshot.val();
            console.log("사용자 데이터:", userData); // 사용자 데이터 확인
            document.querySelector('.profile-info h3').textContent = userData.username || '닉네임 없음';
            document.querySelector('.profile-info p').textContent = '이메일: ' + user.email;

            if (user.photoURL) {
                document.querySelector('.profile-img').src = user.photoURL;
            }
        }).catch((error) => {
            console.error("사용자 데이터 가져오기 중 오류 발생:", error);
        });
    } else {
        console.log("사용자 로그인되지 않음"); // 사용자 비로그인 상태
        document.querySelector('.profile-info h3').textContent = '로그인하지 않음';
        document.querySelector('.profile-info p').textContent = '이메일: 없음';
    }
});

// 프로필 이미지 변경 버튼 클릭 이벤트 처리
document.getElementById('edit-profile').addEventListener('click', function() {
    document.getElementById('profile-image-input').click();
});

// 파일 선택 후 이미지 업로드 및 프로필 업데이트
document.getElementById('profile-image-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const user = firebase.auth().currentUser;
        const storageRef = firebase.storage().ref('profile_images/' + user.uid);

        console.log("이미지 업로드 시작"); // 이미지 업로드 시작 로그

        // Firebase Storage에 이미지 업로드
        const uploadTask = storageRef.put(file);
        
        uploadTask.on('state_changed', 
            (snapshot) => {
                // 업로드 상태 변화 감지 (progress 표시 등 추가 가능)
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
                    user.updateProfile({
                        photoURL: downloadURL
                    }).then(() => {
                        console.log("프로필 이미지 업데이트 성공"); // 프로필 이미지 업데이트 성공 로그
                        document.querySelector('.profile-img').src = downloadURL;
                        alert("프로필 이미지가 성공적으로 변경되었습니다.");
                    }).catch((error) => {
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
document.getElementById('view-orders').addEventListener('click', function() {
    window.location.href = 'order-history.html';
});

document.getElementById('update-credentials-form').addEventListener('submit', function(event) {
    event.preventDefault();
    console.log("비밀번호 변경 폼 제출됨"); // 폼 제출 확인

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

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

    const credentials = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    console.log("재인증 시도 중"); // 재인증 시작 로그

    // 기존 비밀번호 확인을 위해 재인증
    user.reauthenticateWithCredential(credentials).then(() => {
        console.log("재인증 성공"); // 재인증 성공 로그
        
        // 비밀번호 업데이트 시도
        user.updatePassword(newPassword).then(() => {
            console.log("비밀번호 변경 성공"); // 비밀번호 변경 성공 로그
            alert("비밀번호가 성공적으로 변경되었습니다.");
        }).catch((error) => {
            console.error("비밀번호 변경 중 오류 발생:", error); // 비밀번호 변경 중 에러 로그
            alert("비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        });
    }).catch((error) => {
        console.error("재인증 실패:", error); // 재인증 실패 로그
        alert("기존 비밀번호가 올바르지 않습니다.");
    });
});
