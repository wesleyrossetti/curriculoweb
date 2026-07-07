(function($){

	/* ---------------------------------------------- /*
	 * Preloader
	/* ---------------------------------------------- */

	$(window).load(function() {
		$('#status').fadeOut();
		$('#preloader').delay(350).fadeOut('slow');
	});

	/* ---------------------------------------------- /*
	 * Background image, WOW animations and text rotator
	 * Registered here (outside ready) so the listener is active
	 * before loader.js synchronously triggers 'siteDataLoaded'.
	/* ---------------------------------------------- */

	$(document).on('siteDataLoaded', function(e, data) {
		var bg = (data && data.intro && data.intro.background_image)
			? data.intro.background_image
			: 'assets/images/braga3.jpg';
		$('#intro').backstretch([bg]);

		$('.rotate').textrotator({
			animation: 'dissolve',
			separator: '|',
			speed: 3000
		});

		wow = new WOW({ mobile: false });
		wow.init();
	});

	$(document).ready(function() {

		var navbar = $('.navbar');

		function getNavbarOffset() {
			return navbar.outerHeight() + 12;
		}

		function syncNavbarState() {
			var isCompact = $(window).width() <= 767;
			var isScrolled = $(window).scrollTop() >= Math.max(navbar.outerHeight(), 40);

			navbar.toggleClass('navbar-color', isScrolled);
			navbar.toggleClass('custom-collapse', isCompact);
		}

		$('body').scrollspy({
			target: '.navbar-custom',
			offset: getNavbarOffset()
		});

		$(document).on('click','.navbar-collapse.in',function(e) {
			if( $(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle' ) {
				$(this).collapse('hide');
			}
		});

		$('a[href^="#"]').bind("click", function(e){
			var anchor = $(this);
			var targetSelector = anchor.attr('href');

			if(!targetSelector || targetSelector === '#') {
				return;
			}

			var target = $(targetSelector);

			if(!target.length) {
				return;
			}

			$('html, body').stop().animate({
				scrollTop: Math.max(target.offset().top - getNavbarOffset(), 0)
			}, 1000);
			e.preventDefault();
		});

		/* ---------------------------------------------- /*
		 * Navbar
		/* ---------------------------------------------- */

		$(window).on('scroll resize', syncNavbarState);
		syncNavbarState();
		$('body').scrollspy('refresh');

		/* ---------------------------------------------- /*
		 * Count to
		/* ---------------------------------------------- */

		$('#stats').waypoint(function() {
			$('.timer').each(function() {
				var counter = $(this).attr('data-count');
				$(this).delay(6000).countTo({
					from: 0,
					to: counter,
					speed: 3000,// Stats Counter Speed
					refreshInterval: 50,
				});
			});
		 }, { offset: '70%', triggerOnce: true });


		/* ---------------------------------------------- /*
		 * Owl slider
		/* ---------------------------------------------- */

		$("#owl-clients").owlCarousel({
			items : 4,
			slideSpeed : 300,
			paginationSpeed : 400,
			autoPlay: 5000
		});

		$("#certificates-carousel").owlCarousel({
			items: 3,
			itemsDesktop: [1199, 3],
			itemsDesktopSmall: [979, 2],
			itemsTablet: [768, 2],
			itemsMobile: [479, 1],
			slideSpeed: 300,
			paginationSpeed: 500,
			autoPlay: 6000,
			stopOnHover: true,
			navigation: true,
			navigationText: [
				'<i class="fas fa-chevron-left"></i>',
				'<i class="fas fa-chevron-right"></i>'
			],
			pagination: true
		});

		/* ---------------------------------------------- /*
		 * Portfolio pop up
		/* ---------------------------------------------- */

		$('#portfolio').magnificPopup({
			delegate: 'a.pop-up',
			type: 'image',
			gallery: {
				enabled: true,
				navigateByImgClick: true,
				preload: [0,1]
			},
			image: {
				titleSrc: 'title',
				tError: 'The image could not be loaded.',
			}
		});

		$('.video-pop-up').magnificPopup({
			type: 'iframe'
		});

		/* ---------------------------------------------- /*
		 * A jQuery plugin for fluid width video embeds
		/* ---------------------------------------------- */

		$(".video").fitVids();

		/* ---------------------------------------------- /*
		 * E-mail validation
		/* ---------------------------------------------- */

		function isValidEmailAddress(emailAddress) {
			var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
			return pattern.test(emailAddress);
		};

		/* ---------------------------------------------- /*
		 * Contact form ajax
		/* ---------------------------------------------- */

		$("#contact-form").submit(function(e) {

			e.preventDefault();

			var name = $("#name").val();
			var email = $("#email").val();
			var message = $("#message ").val();
			var responseMessage = $('.ajax-response');

			if (( name== "" || email == "" || message == "") || (!isValidEmailAddress(email) )) {
				responseMessage.fadeIn(500);
				responseMessage.html('<i class="fa fa-warning"></i> Check all fields.');
			}

			else {
				$.ajax({
					type: "POST",
					url: "principal/enviaEmail",
					dataType: 'json',
					data: {
						email: email,
						name: name,
						message: message
					},
					beforeSend: function(result) {
						$('#contact-form button').empty();
						$('#contact-form button').append('<i class="fa fa-cog fa-spin"></i> Wait...');
					},
					success: function(result) {
						if(result.sendstatus == 1) {
							responseMessage.html(result.message);
							responseMessage.fadeIn(500);
							$('#contact-form').fadeOut(500);
						} else {
							$('#contact-form button').empty();
							$('#contact-form button').append('<i class="fa fa-retweet"></i> Try again.');
							responseMessage.html(result.message);
							responseMessage.fadeIn(1000);
						}
					}
				});
			}

			return false;

		});

	});

})(jQuery);
