
// Scroll-Activated Navbar Code

//		 START		//
const body = document.body;
let lastScroll = 0;

window.addEventListener("scroll", () => {
	const currentScroll = window.pageYOffset;
	if (currentScroll <= 0) {
		body.classList.remove("scroll-up");
		return;
	}

	if (currentScroll > lastScroll && !body.classList.contains("scroll-down")) {
		body.classList.remove("scroll-up");
		body.classList.add("scroll-down");
	} else if (
		currentScroll < lastScroll &&
		body.classList.contains("scroll-down")
	) {
		body.classList.remove("scroll-down");
		body.classList.add("scroll-up");
	}
	lastScroll = currentScroll;
});

//----------END----------//


//-------Mobile Nav------//
//		START			//

const menuBtn = document.getElementById('menu-btn')
const menu = document.getElementById('menu')
const toggleMenu = (e) => {
    menuBtn.classList.toggle('open')
    menu.classList.toggle('hidden')
    menu.classList.toggle('flex')

}
menuBtn.addEventListener('click', toggleMenu)

//---------END---------//