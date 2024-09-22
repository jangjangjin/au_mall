document.addEventListener("DOMContentLoaded", function() {
    fetch('../components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
        });

    // 회원가입 버튼 클릭 시 회원가입 페이지로 이동
    document.getElementById('signup-button').addEventListener('click', function() {
        window.location.href = 'signup.html';
    });
});