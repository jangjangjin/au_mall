document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // 기본 폼 제출 방지

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // 데이터베이스에서 사용자 검색
    const usersRef = firebase.database().ref('users');

    usersRef.once('value', (snapshot) => {
        let userFound = false;
        
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            // 이메일과 비밀번호 확인
            if (userData.email === email && userData.password === password) {
                userFound = true;
                alert('로그인 성공!');
                // 로그인 후 할 작업 (예: 사용자 페이지로 이동)
                // window.location.href = '/html/mypage.html';
                return true; // 루프 종료
            }
        });

        if (!userFound) {
            alert('로그인 실패: 이메일 또는 비밀번호가 잘못되었습니다.');
        }
    }).catch((error) => {
        console.error('로그인 중 오류 발생:', error);
    });
});
