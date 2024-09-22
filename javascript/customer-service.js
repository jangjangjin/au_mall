document.addEventListener("DOMContentLoaded", function() {
    fetch('../components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
        });

    // 문의하기 폼 제출 이벤트 처리
    document.getElementById('inquiry-form').addEventListener('submit', function(event) {
        event.preventDefault();
        alert('문의가 접수되었습니다.');
        // 문의 내용 처리 코드 추가
    });
});