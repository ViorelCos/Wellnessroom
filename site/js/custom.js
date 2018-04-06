(function($) {
	'use strict';
	/*
		$(function() {
			$('a[href*=#]').on('click', function(e) {
				e.preventDefault();
				$('html, body').animate({
					scrollTop : $($(this).attr('href')).offset().top
				}, 1500, 'linear');
			});
		});
	*/
	setTimeout(function(){
			$('body').addClass('loaded');
		}, 3000);

	//============================== header =========================

	$(window).on('load', function(){
		$('#body').each(function(){
			var header_area = $('.header');
			var main_area = header_area.find('.navbar');
			var logo = main_area.find('.site-logo');
			var navigation = main_area.find('.navigation');
			var original = {
				nav_top: navigation.css('margin-top')
			};

			$(window).scroll(function(){
				if( main_area.hasClass('navbar-sticky') && ($(this).scrollTop() <= 100)){
					main_area.removeClass('navbar-sticky  bg-white').appendTo(header_area);
					navigation.animate({'margin-top': original.nav_top}, {duration: 100, queue: false, complete: function(){
						header_area.css('height', 'auto');

					}});
				}else if( !main_area.hasClass('navbar-sticky') &&
					$(this).scrollTop() > 400 ){

					header_area.css('height', header_area.height());
					main_area.css({'opacity': '0'}).addClass('navbar-sticky bg-white');
					main_area.appendTo($('body')).animate({'opacity': 1});

					navigation.css({'margin-top': '0px'});
				}
			});
		});

		$(window).trigger('resize');
		$(window).trigger('scroll');
	});

	//============================== ICON TOGGLER ANIMATION =========================
	$('.btn-cart').on('click', function(e){
		e.preventDefault();
		$('.cart_item-box').toggleClass('visible');
	});

	$('.btn-search').on('click', function(e){
		e.preventDefault();
		$('.search_form').toggleClass('visible');
	});

	var toolbarToggle = $('.icon-toggle');
	function closeToolBox() {
		toolbarToggle.removeClass('active');
	}
	toolbarToggle.on('click', function(e) {
		var currentValue = $(this).attr('href');
		if($(e.target).is('.active')) {
			closeToolBox();
		} else {
			closeToolBox();
			$(this).addClass('active');
		}
		e.preventDefault();
	});

	$('.navbar a.dropdown-toggle').on('click', function(e) {
		var elmnt = $(this).parent().parent();
		if (!elmnt.hasClass('navbar-nav')) {
			var li = $(this).parent();
			var heightParent = parseInt(elmnt.css('height').replace('px', ''),10) / 2;
			var widthParent = parseInt(elmnt.css('width').replace('px', ''),10) - 10;

			if(!li.hasClass('show')){li.addClass('show');}
			else{ li.removeClass('show');}
			$(this).next().css('top', heightParent + 'px');
			$(this).next().css('left', widthParent + 'px');

			return false;
		}
	});

	//============================== ALL DROPDOWN ON HOVER =========================
	if($('.navbar').width() > 768){
		$('.navbar-nav .dropdown').hover(function() {
			$(this).addClass('show');
		},
		function() {
			$(this).removeClass('show');
		});
	}
	//============================== ALL DROPDOWN ON HOVER =========================

	if($('body').hasClass('boxed')){

		$('#main-slider').addClass('container');
	}else {

		$('#main-slider').removeClass('container');
	}

	//============================== MAIN SLIDER =========================
	function doAnimations(elements) {
		var animationEndEvents = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
		elements.each(function() {
			var $this = $(this);
			var $animationDelay = $this.data('delay');
			var $animationType = 'animated ' + $this.data('animation');
			$this.css({
				'animation-delay': $animationDelay,
				'-webkit-animation-delay': $animationDelay
			});
			$this.addClass($animationType).one(animationEndEvents, function() {
				$this.removeClass($animationType);
			});
		});
	}

	var $myCarousel = $('#carousel-example-generic, #carousel-example-two'),
	$firstAnimatingElems = $myCarousel.find('.carousel-item:first').find("[data-animation ^= 'animated']");

	$myCarousel.carousel();
	doAnimations($firstAnimatingElems);
	$myCarousel.carousel('pause');
	$myCarousel.on('slide.bs.carousel', function (e) {
		var $animatingElems = $(e.relatedTarget).find("[data-animation ^= 'animated']");
		doAnimations($animatingElems);
	});

	$('.main-slider .inner').on('init', function(e, slick) {
		var $firstElements = $('.slide1').find('[data-animation]');
		doAnimations($firstElements);
	});

	$('.main-slider .inner').on('beforeChange', function(e, slick, currentSlide, nextSlide) {
		var $animatingElements = $('div.slide[data-slick-index="' + nextSlide + '"]').find('[data-animation]');
		doAnimations($animatingElements);
	});

	$('.main-slider .inner').slick({
		autoplay: true,
		autoplaySpeed: 3000,
		dots: true,
		arrows: false,
		fade: true,
		responsive: [
		{
			breakpoint: 1024,
			settings: {
				dots: true
			}
		},
		{
			breakpoint: 768,
			settings: {
				dots: false,
				arrows: false,
				autoplay: true
			}
		},
		{
			breakpoint: 480,
			settings: {
				dots: false
			}
		}
		]
	});

	/* Slick Slider for Element carousels */
	$('#brands').slick({
		autoplay: true,
		infinite: true,
		slidesToShow: 3,
		slidesToScroll: 1,
		responsive: [
		{
			breakpoint: 1024,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 2,
				infinite: true,
				dots: false
			}
		},
		{
			breakpoint: 992,
			settings: {
				slidesToShow: 2,
				slidesToScroll: 2,
				infinite: true,
				dots: false
			}
		},
		{
			breakpoint: 768,
			settings: {
				dots: false,
				arrows: false,
				autoplay: true,
				slidesToShow: 2,
				slidesToScroll: 2
			}
		},
		{
			breakpoint: 480,
			settings: {
				slidesToShow: 1,
				slidesToScroll: 1,
				arrows: false,
				dots: false,
				autoplay: true,
				autoplaySpeed: 3000
			}
		}
		]
	});

	$('#image-carousel').slick({
		infinite: true,
		slidesToShow: 3,
		slidesToScroll: 1,
		arrows: true,
		responsive: [
		{
			breakpoint: 1024,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 2,
				infinite: true,
				dots: false
			}
		},
		{
			breakpoint: 992,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 3,
				infinite: true,
				arrows: true,
				dots: false
			}
		},
		{
			breakpoint: 768,
			settings: {
				dots: false,
				arrows: false,
				autoplay: true,
				slidesToShow: 2,
				slidesToScroll: 2
			}
		},
		{
			breakpoint: 480,
			settings: {
				slidesToShow: 1,
				slidesToScroll: 1,
				arrows: false,
				dots: false,
				autoplay: true,
				autoplaySpeed: 3000
			}
		}
		]
	});

	$('#card').slick({
		slidesToShow: 3,
		slidesToScroll: 3,
		arrows: false,
		dots: true,
		responsive: [
		{
			breakpoint: 1024,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 3,
				infinite: true,
				dots: false
			}
		},
		{
			breakpoint: 992,
			settings: {
				slidesToShow: 2,
				slidesToScroll: 2,
				infinite: true,
				dots: false
			}
		},
		{
			breakpoint: 768,
			settings: {
				dots: false,
				arrows: false,
				autoplay: true,
				slidesToShow: 2,
				slidesToScroll: 2
			}
		},
		{
			breakpoint: 480,
			settings: {
				slidesToShow: 1,
				slidesToScroll: 1,
				arrows: false,
				dots: false,
				autoplay: true,
				autoplaySpeed: 3000
			}
		}
		]
	});

	$('#testimonial').slick({
		slidesToShow: 2,
		slidesToScroll: 2,
		arrows: false,
		dots: true,
		responsive: [
		{
			breakpoint: 1024,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 3,
				infinite: true,
				dots: false
			}
		},
		{
			breakpoint: 992,
			settings: {
				slidesToShow: 2,
				slidesToScroll: 2,
				infinite: true,
				dots: false
			}
		},
		{
			breakpoint: 768,
			settings: {
				dots: false,
				arrows: false,
				autoplay: true,
				slidesToShow: 1,
				slidesToScroll: 1
			}
		},
		{
			breakpoint: 480,
			settings: {
				slidesToShow: 1,
				slidesToScroll: 1,
				arrows: false,
				dots: false,
				autoplay: true,
				autoplaySpeed: 3000
			}
		}
		]
	});


	/* Slick Slider for Main pages carousels */
	$('.slick_brands').slick({
		infinite: true,
		slidesToShow: 4,
		slidesToScroll: 1,
		responsive: [
		{
			breakpoint: 1024,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 2,
				infinite: true,
				dots: false
			}
		},
		{
			breakpoint: 992,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 3,
				infinite: true,
				dots: false
			}
		},
		{
			breakpoint: 768,
			settings: {
				dots: false,
				arrows: false,
				autoplay: true,
				slidesToShow: 2,
				slidesToScroll: 2
			}
		},
		{
			breakpoint: 480,
			settings: {
				slidesToShow: 1,
				slidesToScroll: 1,
				arrows: false,
				dots: false,
				autoplay: true,
				autoplaySpeed: 3000
			}
		}
		]
	});

	$('.event_carousel').slick({
		infinite: true,
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: false,
		fade: true,
		autoplay: true,
		autoplaySpeed: 3000
	});
	//============================== CIRCLE PROGRESS =========================

		var el = $('.circle1'),
		    inited = false;

		el.appear({ force_process: true });

		el.on('appear', function() {
		  if (!inited) {
		    el.circleProgress({
		    	size : 150
		    });
		    inited = true;
		  }
		});

	//============================== FANCYBOX =========================
	
	
	//============================== DATE PICKER =========================
	$('.datepicker').datepicker({
		startDate: 'dateToday',
		autoclose: true
	});

	$('.select-drop').selectbox();

	$('.box-video').click(function(){
		$('iframe',this)[0].src += "&amp;autoplay=1";
		$(this).addClass('open');
	});
	//============================== PRICE SLIDER RANGER =========================
	var minimum = 12;
	var maximum = 30;

	$( '#price-range' ).slider({
		range: true,
		min: minimum,
		max: maximum,
		values: [ minimum, maximum ],
		slide: function( event, ui ) {
			$( '#price-amount-1' ).val( '$' + ui.values[ 0 ] );
			$( '#price-amount-2' ).val( '$' + ui.values[ 1 ] );
		}
	});

	$( '#price-amount-1' ).val( '$' + $( '#price-range' ).slider( 'values', 0 ));
	$( '#price-amount-2' ).val( '$' + $( '#price-range' ).slider( 'values', 1 ));

	//============================== TIMER =========================
	$('.simple_timer').syotimer({
		year: 2018,
		month: 5,
		day: 9,
		hour: 20,
		minute: 30
	});


  	$('.counter').counterUp({

		delay : 10,
		time : 3000

  	});


	/*---------------------------------
	---> map
	---------------------------------*/
	function initialize() {
			var styleArray = [{
	        'featureType': 'poi',
	        'elementType': 'all',
	        'stylers': [{
	                'visibility': 'on'
	            },
	            {
	                'saturation': '13'
	            }]
	    	}];

		var myLatLng = {lat: 46.2212741, lng: 15.5685031};

		var mapOptions = {
			zoom: 8,
			scrollwheel: false,
			center: new google.maps.LatLng(46.3920, 15.5728),
			styles: styleArray
		};

		var map = new google.maps.Map(document.getElementById('map'), mapOptions);
		var image = 'img/marker.png';
		var marker = new google.maps.Marker({
			position: myLatLng,
			map: map,
			icon : image
		});
	}
	var mapId = $('#map');
	if (mapId.length) {
		google.maps.event.addDomListener(window, 'load', initialize);
	}

	/*---------------------------------
	---> Isotop js
	---------------------------------*/
	var grid = $('.gallery_grid');

	if(grid.length) {
		grid.isotope({
			itemSelector : '.element',
			layoutMode : 'fitRows'
		});

		$('#filters .button').on('click', function() {
			$('#filters .button').removeClass('active');
			$(this).addClass('active');

			var selector = $(this).attr('data-filter');
			$('.gallery_grid').isotope({
				filter : selector
			});
			return false;
		});
	}
	$(document).on('click','.navbar-collapse.show',function(e) {
		$(this).collapse('hide');
		$('.burger-menu').toggleClass('active');
	});
})(jQuery);
