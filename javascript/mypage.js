document.addEventListener("DOMContentLoaded", function() {
    fetch('../components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
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
});