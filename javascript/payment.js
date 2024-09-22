document.addEventListener("DOMContentLoaded", function() {
    fetch('../components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
        });

    // 주문하기 버튼 클릭 이벤트 처리
    document.getElementById('place-order').addEventListener('click', function() {
        alert('주문이 완료되었습니다.');
        // 주문 완료 후 처리할 코드 추가
        // 예: 서버로 주문 정보 전송, 결제 처리 등
    });
});