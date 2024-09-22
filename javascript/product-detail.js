

    // 장바구니에 추가 버튼 클릭 이벤트 처리
    document.getElementById('add-to-cart').addEventListener('click', function() {
        alert('장바구니에 추가되었습니다.');
    });

    // 결제하기 버튼 클릭 이벤트 처리
    document.getElementById('buy-now').addEventListener('click', function() {
        window.location.href = 'payment.html';
    });

    // 리뷰 보기 버튼 클릭 이벤트 처리
    document.getElementById('view-reviews').addEventListener('click', function() {
        window.location.href = 'reviews.html';
    });