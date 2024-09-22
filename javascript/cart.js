
    // 전체 선택 체크박스 이벤트 처리
    document.getElementById('select-all').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => checkbox.checked = this.checked);
        updateTotalPrice();
    });

    // 개별 항목 체크박스 이벤트 처리
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateTotalPrice);
    });

    // 수량 변경 버튼 이벤트 처리
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const quantityElement = this.parentElement.querySelector('.quantity');
            let quantity = parseInt(quantityElement.textContent);

            if (action === 'increase') {
                quantity++;
            } else if (action === 'decrease' && quantity > 1) {
                quantity--;
            }

            quantityElement.textContent = quantity;
            updateTotalPrice();
        });
    });

    // 항목 제거 버튼 이벤트 처리
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            this.parentElement.remove();
            updateTotalPrice();
        });
    });

    // 총 결제 금액 업데이트 함수
    function updateTotalPrice() {
        let totalPrice = 0;
        document.querySelectorAll('.cart-item').forEach(item => {
            const checkbox = item.querySelector('.item-checkbox');
            if (checkbox.checked) {
                const price = parseInt(item.querySelector('.item-info p').textContent.replace('₩', '').replace(',', ''));
                const quantity = parseInt(item.querySelector('.quantity').textContent);
                totalPrice += price * quantity;
            }
        });
        document.getElementById('total-price').textContent = `₩${totalPrice.toLocaleString()}`;
    }

    // 결제하기 버튼 클릭 이벤트 처리
    document.getElementById('checkout').addEventListener('click', function() {
        window.location.href = 'payment.html';
    });
