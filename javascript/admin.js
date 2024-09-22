document.addEventListener("DOMContentLoaded", function() {
    fetch('../components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
        });

    // 상품 추가 폼 제출 이벤트 처리
    document.getElementById('add-product-form').addEventListener('submit', function(event) {
        event.preventDefault();
        alert('상품이 추가되었습니다.');
        // 상품 추가 처리 코드 추가
    });

    // 상품 제거 버튼 클릭 이벤트 처리
    document.querySelectorAll('.remove-product').forEach(button => {
        button.addEventListener('click', function() {
            alert('상품이 제거되었습니다.');
            // 상품 제거 처리 코드 추가
        });
    });

    // 회원 제거 버튼 클릭 이벤트 처리
    document.querySelectorAll('.remove-user').forEach(button => {
        button.addEventListener('click', function() {
            alert('회원이 제거되었습니다.');
            // 회원 제거 처리 코드 추가
        });
    });
});