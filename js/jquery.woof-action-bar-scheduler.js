/*!
 * jQuery Woof Action Bar
 * Copyright (c) 2016 Jacob Vega Canote @ WEBDOGS.COM
 * Version: 1.0
 * Requires: jQuery v1.7 or later
 */
;(function($)
{
	$.fn.WoofActionBar = function(options){

		if ( typeof WABS_setting == 'undefined' ) return false;

		// Find out about the website itself
		var origHtmlMargin  = parseFloat($('html').css('margin-top')); // Get the original margin-top of the HTML element so we can take that into account
		var origHtmlBkColor = $('html').css('background-color'); 
		var origBodyBkColor = $('body').css('background-color'); 
		var origHtmlImage   = $('html').css('background-image'); 
		var origBodyImage   = $('body').css('background-image'); 

		var HtmlMargin;
		var HtmlBkColor;
		var BodyBkColor;
		var HtmlImage;
		var BodyImage;
		var HtmlBk;
		var BodyBk;

		var DefaultBkColor = ( WABS_setting.backgroundColor == "" ) ? false : WABS_setting.backgroundColor;
		var HtmlBackground;

		var barState = [];
		var barHeight;
		var barDistance;
		var scrollTop;
		var headerSelector;
		var $topElement;
		var $fixedHeader;
		var topOffset  = 0;
		var fixedTop   = 0;
		var isFixed    = 0;
		var cookieName = 'WABS_action_bar_closed_' + WABS_setting.uniqueID;

		if ( typeof options == 'string'){ // If they specified a command (like "show" or "hide")
			barHeight  = $(WABS_setting.ID).height(); // Accomodate different sized bars
			if ( typeof opts == 'undefined')
				var opts = $.fn.WoofActionBar.defaults;
			switch(options){
				case 'show':
					if ( !$(WABS_setting.ID).hasClass('shown')){
						showBar();
					}
					return false;
				case 'hide':
					if ( $(WABS_setting.ID).hasClass('shown')){
						origHtmlMargin = origHtmlMargin-barHeight; // The "original" value actually includes the bar's added margin when this is called so we need to take it out
						closeBar();
					}
					return false;
			}
		}else{ // Check for options
			var opts = $.extend({}, $.fn.WoofActionBar.defaults, options);
		}

		function fixedElement(element) {
		    var $element  = $(element);
		    var $elements = $element.add($element.parents());
		    var isFixed   = false;
		    $elements.each(function(){
				if ( isFixed)return isFixed;

		    	var $this = $(this);
		        if ($this.css("position") === "fixed") {
		            isFixed = $this;
		        }
		    });
		    return isFixed;
		}
		function topElement(element) {
		    var $element  = $(element);
		    var $elements = ( $element.length ? $element.parent() : $element );
		    var isTop     = false;

		   ( function testTop() {

			   	if ( $elements[0] == document ) return false;
				if ( $elements.length ) {
				    $elements.each(function(){
				    	var $this = $(this);
				        if ( parseFloat( $this.css("top") ) > 0 )
				            isTop = $this;
						if ( isTop )
							return isTop;
						else
							$elements = $elements.parent(), testTop();

				    });
				}

			})();
		    return isTop;
		}
		function logBarState( args ){
			if ( ! opts.debug ) return;
			console.log( args, jQuery.data( WABS_setting.WABS, 'barState', ['live','in'] ) );
		}
		function isBarState( match ){
			return ( jQuery.data( WABS_setting.WABS, 'barState' ).indexOf( match ) !== -1 );
		}
		function createBar(){
			
			$('html').append( WABS_setting.HTML );	
			$('body').prepend( WABS_setting.topSpacer );
			$('.wabs_top_spacer').height(0).show();

			WABS_setting.WABS = $(WABS_setting.ID);
			WABS_setting.WABS
				.on('slideToggle', function(e){

				    logBarState([ 'slideToggle' ]);
					slideToggle();
				})
				.on('slideToggleIn', function(e){

				    logBarState([ 'slideToggleIn' ]);
					slideToggle('in');
				})
				.on('slideToggleOut', function(e){

				    logBarState([ 'slideToggleOut' ]);
					slideToggle('out');
				})
				.on('toggleIn', function(e){
				    logBarState([ 'toggleIn' ]);
					toggleBar('in');
				})
				.on('toggleOut', function(e){
				    logBarState([ 'toggleOut' ]);
					toggleBar('out');
				})
				.on('showBar', function(e){
				    logBarState([ 'showBar' ]);
					showBar();
				})
				.on('closeBar', function(e){
				    logBarState([ 'closeBar' ]);
					closeBar();
				}).css( 'zIndex', opts.zIndex );

			if ( WABS_setting.WABS.hasClass('wabs_scheduled') ) {
				
				( function(WABS){

					var now = Date.now() - ( new Date().getTimezoneOffset() * 60 * 1000 ),
						active = ( function(){ 
							var value = 1; 
							return { 
								set: function(val){ 
									value = val ? 1 : 0; 
									WABS.active = ( WABS.active !== value ? value : WABS.active ); 
								}, 
								get: function(){ 
									return value; 
								} 
							} 
						})(), 
						interval; 

					WABS.active = 0; 
					WABS.activate = function(){ 
						if ( WABS.active ) { return; } 
						active.set(1); 
						WABS.trigger('showBar'); 
					}; 
					WABS.deactivate = function(){ 
						active.set(0);
						clearInterval( interval ); 
						if ( ! WABS.active && WABS.schedule.scheduled() ) { 
							jQuery.data( WABS_setting.WABS, 'barState', [] );
							WABS.trigger('slideToggleOut');
						} else {
							WABS.trigger('closeBar');
						}
					}; 
					WABS.schedule = { 
						start: Number( WABS.attr('data-start-date') ), 
						end: Number( WABS.attr('data-end-date') ), 
						scheduled: function(){ 
							return now < WABS.schedule.start; 
						}, 
						expired: function(){ 
							return now > WABS.schedule.end; 
						}, 
						activated: function(){ 
							return now > WABS.schedule.start && now < WABS.schedule.end; 
						} 
					}; 

					interval = setInterval( function() { 
						now += 1000; 
						WABS[ !WABS.schedule.activated() || WABS.schedule.scheduled() || WABS.schedule.expired() ? 'deactivate' : 'activate' ](); 
					}, 1000 ); 
				})( WABS_setting.WABS );

				if ( !WABS_setting.WABS.schedule.activated() || WABS_setting.WABS.schedule.scheduled() || WABS_setting.WABS.schedule.expired() ) { return WABS_setting.WABS.deactivate(); }
			}

			jQuery.data( WABS_setting.WABS, 'barState', ['live'] );

			HtmlBackground = barBackgroundColor();

			// WABS_setting.headerSelector = "";

			headerSelector = ( typeof WABS_setting.headerSelector == 'undefined' || ! WABS_setting.headerSelector ) ? '.site-header' : WABS_setting.headerSelector ;
			$fixedHeader   = ( WABS_setting.headerSelector == "" ) ? fixedElement( headerSelector ) : $( headerSelector ) ;
			fixedTop       = ( $fixedHeader ) ? parseFloat($fixedHeader.css('height')) : 0;
			$topElement    = topElement( headerSelector );

			if ( $fixedHeader!==false){
				$fixedHeader.css( 'zIndex', opts.zIndex + 1 );
			}

			// console.log( headerSelector, $fixedHeader, fixedTop, $topElement );


			logBarState({createBar: 'showBar ' + showBar() });

			// dropBarTimer = setTimeout( showBar, 800 );

			$('.wabs_close_bar').on('click',function(){
				jQuery.data( WABS_setting.WABS, 'barState', [] );
				closeBar();
				return false;
			});

			//ON SCROLL
			$(window).on('scroll',function(){

				if (  ! isBarState('live') ){ return false; }

				scrollTop = parseFloat($(document).scrollTop());
				barHeight = parseFloat($(WABS_setting.ID).height());
				// logBarState({ scrollTop: scrollTop, barHeight: barHeight });

			    if ( scrollTop >= barHeight ) {
			    	toggleBar('out');
			    } else {
			        toggleBar('in');
			    }
			}).on('resize', function(){
				// logBarState({ isBarStateLive: isBarState('live'), isBarStateOut: isBarState('out'), barState: barState.indexOf( 'out' ) });

				if (  ! isBarState('live') || isBarState('out') ){ return false; }

				barHeight    = $(WABS_setting.ID).height();
				HtmlMargin   = parseFloat($('html').css('margin-top'));
				
				$fixedHeader = ( $fixedHeader ) ? $fixedHeader : fixedElement( headerSelector ) ;
				$topElement  = topElement( headerSelector );
				isFixed      = ( $fixedHeader.length ) ? ( $fixedHeader.css('position').trim() == 'fixed' ) : false;
				topOffset    = ( $topElement ) ? Math.floor( parseFloat( $topElement.css('top') )) : 0;
				barDistance  = String( Math.floor( barHeight - HtmlMargin )) ;
				newDistance  = String( Math.floor( parseFloat( barDistance ) - topOffset ) ) ;
				// console.log(barDistance, topOffset, newDistance);

				$('.wabs_top_spacer').stop().transition({ height: barHeight+'px', easing: 'snap', duration: opts.speedOut });
				// $('.wabs_top_spacer').height( barHeight ) .show();
				// $(WABS_setting.ID).transition({ y:  '0px', duration: 1 });
				$(WABS_setting.ID).transition({ y: '0px', duration: opts.speedOut });
				$fixedHeader.stop().transition({ y: newDistance + 'px', easing: 'snap', duration: opts.speedOut });				

				if (  ! isFixed ){
					$fixedHeader.stop().transition({ y: "0px", easing: 'snap', duration: opts.speedOut }, function(){ $fixedHeader.css({transform:''}); });
				}

			}).on('load', function(){
				$(window).trigger('resize');
			});
		}
		function showBar(){

			logBarState({ showBar: 'indexOf "live" ' + isBarState('live') });

			if (  ! isBarState('live') ){ return false; }

			jQuery.data( WABS_setting.WABS, 'barState', ['live','in'] );

			barHeight    = $(WABS_setting.ID).height();
			HtmlMargin   = parseFloat($('html').css('margin-top'));
			
			$fixedHeader = ( $fixedHeader ) ? $fixedHeader : fixedElement( headerSelector ) ;
			$topElement  = topElement( headerSelector );
			isFixed      = ( $fixedHeader.css('position').trim() == 'fixed' );
			topOffset    = ( $topElement ) ? Math.floor( parseFloat( $topElement.css('top') )) : 0;
			barDistance  = String(  Math.floor( barHeight - HtmlMargin )) ;
			newDistance  = String(  Math.floor( parseFloat( barDistance ) - topOffset ) ) ;

			// console.log(barDistance, topOffset, newDistance);
			logBarState({ showBar: 'HtmlMargin ' + HtmlMargin + ", HtmlColor " + origHtmlBkColor });

			$(WABS_setting.ID).fadeIn().stop().transition({ y: '0px', easing: 'snap', duration: opts.speedOut }).addClass('shown');
			$fixedHeader.stop().transition({ y: newDistance + 'px', easing: 'snap', duration: opts.speedOut });
			$('.wabs_top_spacer').stop().transition({ height: barHeight+'px', easing: 'snap', duration: opts.speedOut });
			$('html').css( 'background', HtmlBackground );

			if (  ! isFixed ){
				$fixedHeader.stop().transition({ y: "0px", easing: 'snap', duration: opts.speedOut }, function(){ $fixedHeader.css({transform:''}); });
			}
			// $('html').css( 'background', HtmlBackground ).transition({ y:  barDistance  + 'px', easing: 'snap', duration: opts.speedIn });
			// return true;
		}
		function barBackgroundColor(){
			origHtmlBkColor = $('html').css('background-color'); 
			origBodyBkColor = $('body').css('background-color'); 
			origHtmlImage   = $('html').css('background-image'); 
			origBodyImage   = $('body').css('background-image'); 

			BodyBkColor = ( origBodyBkColor == 'rgba(0, 0, 0, 0)' ) ? false : origBodyBkColor;
			HtmlBkColor = ( origHtmlBkColor == 'rgba(0, 0, 0, 0)' ) ? false : origHtmlBkColor;
			BodyImage   = ( origBodyImage   == 'none' ) ? false : origBodyImage;
			HtmlImage   = ( origHtmlImage   == 'none' ) ? false : origHtmlImage;
			BodyBK      = ( BodyBkColor  || BodyImage ) ? $('body').css('background') : false; 
			HtmlBK      = ( HtmlBkColor  || HtmlImage ) ? $('html').css('background') : false; 
			
			return ( ! HtmlBK && BodyBK && DefaultBkColor ) ? DefaultBkColor : ( ( BodyBK ) ? BodyBK : origHtmlBkColor );
		}

		function slideToggle( state ){

			barHeight    = WABS_setting.WABS.height();
			HtmlMargin   = parseFloat($('html').css('margin-top'));
			
			$fixedHeader = ( $fixedHeader ) ? $fixedHeader : fixedElement( headerSelector ) ;
			$topElement  = ( $topElement ) ? $topElement : topElement( headerSelector );
			isFixed      = ( $fixedHeader.css('position').trim() == 'fixed' );
			topOffset    = ( $topElement ) ? Math.floor( parseFloat( $topElement.css('top') )) : 0;
			barDistance  = String(  Math.floor( barHeight - HtmlMargin )) ;
			newDistance  = String(  Math.floor( parseFloat( barDistance ) - topOffset ) ) ;
			// console.log(barDistance, topOffset, newDistance);

			// console.log($fixedHeader,$topElement);

			if (  isBarState('out') && state == 'in' ) {

				jQuery.data( WABS_setting.WABS, 'barState', ['live','in'] );
				logBarState({ showBar: 'HtmlMargin ' + HtmlMargin + ", HtmlColor " + origHtmlBkColor });
				
				WABS_setting.WABS.fadeIn().stop().transition({ y: '0px', easing: 'snap', duration: opts.speedIn }).addClass('shown');
				$fixedHeader.stop().transition({ y: newDistance +"px", easing: 'snap', duration: opts.speedOut });
				
				$('html').css( 'background', HtmlBackground );
				$('.wabs_top_spacer').stop().transition({ height: barHeight+'px', easing: 'snap', duration: opts.speedOut });
				// $('.wabs_top_spacer').height( barHeight ) .show();

			} else if (  isBarState('in') && state == 'out' ) {

				jQuery.data( WABS_setting.WABS, 'barState', ['pass','out'] );

				WABS_setting.WABS.fadeIn().stop().transition({ y:"-" + barDistance + 'px', easing: 'snap', duration: opts.speedIn }).addClass('shown');
				$fixedHeader.stop().transition({ y: "0px", easing: 'snap', duration: opts.speedOut });
				
				$('html').css( 'background', '' );
				// $('.wabs_top_spacer').height( barHeight ).hide();
			}	

			if (  ! isFixed ){
				$fixedHeader.stop().transition({ y: "0px", easing: 'snap', duration: opts.speedOut }, function(){ $fixedHeader.css({transform:''}); });
			}
			
			return;

		}
		function toggleBar( state ){
			if (  ! isBarState('live') ){ return false; }

			// logBarState({toggleBar:'live'});

			barHeight    = $(WABS_setting.ID).height();
			HtmlMargin   = parseFloat($('html').css('margin-top'));
			
			$fixedHeader = ( $fixedHeader ) ? $fixedHeader : fixedElement( headerSelector ) ;

			$topElement  = topElement( headerSelector );
			isFixed      = ( $fixedHeader.css('position').trim() == 'fixed' );
			topOffset    = ( $topElement ) ? Math.floor( parseFloat( $topElement.css('top') )) : 0;
			barDistance  = String( Math.floor( barHeight - HtmlMargin ) ) ;
			
			newDistance  = String( Math.floor( parseFloat( barDistance ) - topOffset ) ) ;
			// console.log(barDistance, topOffset, newDistance);

			if (  isBarState('in') && state == 'out' ){
				
				jQuery.data( WABS_setting.WABS, 'barState', ['live','out'] );
				// logBarState({toggleBar:'in'});

				$(WABS_setting.ID).stop().transition({ y: '-'+ barDistance +'px', easing: 'snap', duration: opts.speedOut }, function(){ $(WABS_setting.ID)/*.css({transform:''})*/.css('position','absolute'); });
				$fixedHeader.stop().transition({ y: '0px', easing: 'snap', duration: opts.speedOut });
				
				$('html').css({background: '' });
				$('.wabs_top_spacer').stop().transition({ height: barHeight+'px', easing: 'snap', duration: opts.speedOut });

			} else if (  isBarState('out') && state == 'in'  ){
			
				jQuery.data( WABS_setting.WABS, 'barState', ['live','in'] ); // logBarState({toggleBar:'out'});

				$(WABS_setting.ID).stop().transition({ y: '0px', duration: opts.speedOut });
				$fixedHeader.stop().transition({ y: newDistance + 'px', duration: opts.speedOut });
				
				$('html').css( 'background', HtmlBackground );
				
				$('.wabs_top_spacer').stop().transition({ height: barHeight +'px', easing: 'snap', duration: opts.speedOut });

			}

			if (  ! isFixed ){
				$fixedHeader.stop().transition({ y: "0px", easing: 'snap', duration: opts.speedOut }, function(){ $fixedHeader.css('transform',''); });
			}
		}
		function closeBar(){
			jQuery.data( WABS_setting.WABS, 'barState', [] );

			$fixedHeader = ( $fixedHeader ) ? $fixedHeader : fixedElement( headerSelector ) ;

			$(WABS_setting.ID).stop().transition({ y:  '-'+ barDistance +'px', easing: 'snap', duration: opts.speedOut }, 
					function(){ 
						$(WABS_setting.ID).css('position','absolute'); 
					})
			.removeClass('shown');

			if (  $fixedHeader !== false ) {
				$('.wabs_top_spacer').stop().transition({ height: barHeight +'px', easing: 'snap', duration: opts.speedOut });
				$fixedHeader.stop().transition({ y: "0px", easing: 'snap', duration: opts.speedOut }, 
					function(){ 
						$fixedHeader.css('transform',''); 
						$(WABS_setting.ID).fadeOut();
						$('.wabs_top_spacer').hide(); /*$fixedHeader.css('position','absolute'); */
					});
			} else {
				// $('html').transition({ y: '0px', easing: 'snap', duration: opts.speedOut }, function(){ $('html').css('transform',''); $(WABS_setting.ID).fadeOut(); });
			}
			if ( opts.behavior=='close'){
				setCookie( cookieName,'true', opts.daysHidden );
			}
		}
		function setCookie(name,value,exdays){
			var exdate = new Date();
			exdate.setDate(exdate.getDate()+exdays);
			var value=escape(value)+((exdays==null)?'':'; expires='+exdate.toUTCString());
			document.cookie=name+'='+value+'; path=/;';
		}
		function getCookie(name){
			var i,x,y,ARRcookies = document.cookie.split(";");
			for(i=0;i<ARRcookies.length;i++){
				x = ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
				y = ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
				x = x.replace(/^\s+|\s+$/g,"");
				if ( x==name){
					return unescape(y);
				}
			}
		}
		// barState = ['live'];
		if (  typeof getCookie( cookieName ) == 'undefined' || opts.behavior=='toggle' ){ // Show if debug. Show if iPhone/iPad in Mobile Safari & don't have cookies already.			
			
			// jQuery.data( WABS_setting.WABS, { barState: ['live'] });

			// logBarState({init:'noCookie'});

			createBar();
		}

	},
	// override these globally if you like (they are all optional)
	$.fn.WoofActionBar.defaults = WABS_setting.options;
	/*{
		speedIn: 600, // Show animation speed of the bar
		speedOut: 400, // Close animation speed of the bar
		daysHidden: 15, // Duration to hide the bar after being closed (0 = always show bar)
		daysReminder: 90, // Duration to hide the bar after "Save" is clicked *separate from when the close button is clicked* (0 = always show bar)
		debug: false // Whether or not it should always be shown (even for non-iOS devices & if cookies have previously been set) *This is helpful for testing and/or previewing
	};*/
})(jQuery);

jQuery().WoofActionBar();

