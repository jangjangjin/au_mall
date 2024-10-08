// 슬라이더 기능
let slideIndex = 0;
showSlides();

function showSlides() {
  const slides = document.getElementsByClassName("slide");
  const dots = document.getElementsByClassName("dot");
  
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  slideIndex++;
  if (slideIndex > slides.length) { slideIndex = 1; }    
  
  for (let j = 0; j < dots.length; j++) {
    dots[j].className = dots[j].className.replace(" active", "");
  }

  slides[slideIndex - 1].style.display = "block";  
  dots[slideIndex - 1].className += " active";  
  setTimeout(showSlides, 3000); // 3초마다 슬라이드 변경
}
