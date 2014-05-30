var $PSserver = 'http://www.planetseed.com/';
var $server = 'http://www.planetseed.com/';
var ajaxing = false;
var fetchdata = false;
var jsonRequest;
var category = '';
var loadCategory = 0;
var qSubmit = false;
var qSubmitSuccess = false;
var lastUpdateInterval=0;

var Application = {
    

    initApplication: function () {
           
        $(document)
        
            .on('pagebeforeshow', '#home-page', function () {
             
             ajaxing = false; // set ajaxing to false 
                
             //load category once a day for iOS.
             var d = new Date();
             if( loadCategory>0 && ( d.getTime() > (loadCategory + (3600*24) ))) 
             { 
               loadCategory=0;
               Application.initQuestionPage();
               $('#atx-questionform')[0].reset();  
             }
                
            })
        
            .on('pageinit', '#browsetopic-page', function () {
                Application.initCategoryPage();
            })
            .on('pagebeforeshow', '#browsetopic-page', function () {
               if (loadCategory === 0)                   Application.initCategoryPage();
            })  
        
        // pageshow 
          .on('pageshow', '#browsetopic-page', function () {
               var count =$('#category-list').children().length;
               if(count<1)
               {
                //    $('#category-list').empty();   
                Application.initCategoryPage(); 
               }
              /*
               if ($('#category-list').hasClass('ui-listview')) {
                   $('#category-list').listview('refresh');
               }
              */  
            })  
          
         .on('pageinit', '#asktheexpert-page', function () {
                //   Application.initCategoryPage();
            })
        
            .on('pagebeforeshow', '#atx-form-page', function () {
                qSubmit = false;
            })
        
            .on('pageinit', '#atx-form-page', function () {
                qSubmit = false;
                $('[type="submit"]').button('enable');
                Application._getDbValues();
                $('#atx-country').selectmenu("refresh");
                //$('#atx-age').selectmenu("refresh");
            
            })
        
            .on('pageinit', '#faq-detail-page-ext', function () {
                $('#faq-detail-page-ext .content').html($('#faq-detail-page .content').html());
                $.mobile.activePage.trigger("refresh");  
            })
        ;
        document.addEventListener("backbutton", function(e) {
            if ($.mobile.activePage.is('#home-page')) {
                e.preventDefault();
                navigator.app.exitApp();
            } else {
                navigator.app.backHistory()
            }
        }, false);
    },

    loadApplication: function () {
       Application.loadCountry();
      // Application.loadAge();
       Application.initAtxFormPage();
       Application.initQuestionPage();
        
       if (isDevice === true) {
          navigator.splashscreen.hide();
       }
       $(".btnclose").on("tap", function() {
           navigator.app.exitApp();
       });
        
       $(document).bind("mobileinit", function () {
            $.mobile.defaultPageTransition = 'none';
            $.mobile.defaultDialogTransition = 'none';
            $.mobile.buttonMarkup.hoverDelay = 0;
       //     $.mobile.defaultHomeScroll = 0;
       //     $.mobile.silentScroll=0; 
        });
        
        
        
        $(document).on("change", '#app-language', function(event) {
            loadCategory = 0;
            Application.initCategoryPage();
        });
        
        $('#homeAskBtn').click(function(e) {
             $.mobile.loading('show');
            if (!Application.checkConnection()) e.preventDefault(); 
             $.mobile.loading('hide');
        });
        
        $('#homeBrowseBtn').click(function(e) {
            $.mobile.loading('show');
            if (ajaxing) {  e.preventDefault(); } // load only when ajax call compelete
            if (!Application.checkConnection()) e.preventDefault(); 
            $.mobile.loading('hide');
        });
        
        
        //Question submit step 1
        //$(document).off("submit", '#atx-questionform').on("submit", '#atx-questionform', function(event) {       
       $('#atx-questionform').submit(function (event) {
            
           $( '#atx-questionform [type="submit"]').button('disable');
            var data = { };
            data['question'] = $('#atx-question').val().trim(); 
            data['category'] = $('#atx-question-category').val().trim();  
            if (data['category'] === '') {
                navigator.notification.alert('Invalid Category, Please select question category', function () { $('#atx-questionform [type="submit"]').button('enable');
                }, 'Error');
                
                return false;
            }              
            if (data['question'] === '') {
                navigator.notification.alert('Question is required and cannot be empty', function () { $('#atx-questionform [type="submit"]').button('enable');
                }, 'Error');
             //    $('#atx-questionform [type="submit"]').button('enable');
                return false;
            }
           
            $('#atx-questionform [type="submit"]').button('enable');
            event.preventDefault();
            $.mobile.changePage("#atx-form-page", { transition: "none", changeHash: true });
            return false;
        });
        
        
        //abort ajax request if any bottom nav bar button click
        $('.btmbutton').click(function(e) {
           
            if (jsonRequest) {
        	jsonRequest.abort();
        	jsonRequest = null;
            $.mobile.loading('hide');
            qSubmit = false;
            ajaxing = false;    
           } 
           $('#atx-form-page [type="submit"]').button('enable'); 
           $('#atx-questionform [type="submit"]').button('enable');
           
               
        });
        
        
        
    },
    

    /**********************************************/
    // initAtxFormPage();
    //
    // Submit user question to server
    // 
    /*********************************************/ 
    
    

    initAtxFormPage: function () {
        $('#atx-form').submit(function (event) {
            if (! Application.checkConnection())
                return;

            event.preventDefault();
            var data = Application._setDbValues();
           // console.log(data);
            if (typeof(data) == 'boolean')
                return false;
            
            if (qSubmit == true) {
                navigator.notification.alert('Submitting is in progress', function () {
                }, 'Error');
                return;
            } 
            
            qSubmit = true;     
            qSubmitSuccess = false;
            var url = $server + 'services/atx_tktsubmit';
            $.ajax({  
                       callbackParameter:'callback', 
                       url: url,
                       type: 'POST',
                       crossDomain: true,
                	   timeout:30000,
                       data: data,
                       jsonpCallback:'callback',
                       success: function(data) {
                           if (data["success"] == 1) {
                               if (isDevice != true) {
                                   $('#verifyurl').html('<a href="' + data["verifyurl"] + '" target="_blank">verify</a>');
                               }
                               $('#atx-questionform')[0].reset();
                               qSubmitSuccess = true;
                           } else {
                               qSubmitSuccess = false;
                               if (data["success"] == 0) {
                               navigator.notification.alert(data["error"], function () {  }, 'Error');}
                               else {
                               navigator.notification.alert('Invalid value', function () { }, 'Error');}
                           }
                       },
                       complete: function () {
                           $.mobile.loading('hide');
                           qSubmit = false;
                           $('[type="submit"]').button('enable');
                           console.log('Question submitted:ajax Complete');
                           if (qSubmitSuccess == true) {
                               $.mobile.changePage("#atx-success-page", { transition: "fade", changeHash: false });
                           }                           
                       },

                       beforeSend: function() {
                           $.mobile.loading('show');
                           $('#atx-form [type="submit"]').button('disable');
                       },
                      error: function (e, textStatus) {
                          Application.showError (e, textStatus);
                      }
                   });
            return false;
        });
    },



    /**********************************************/
    // initQuestionPage();
    //
    // load categories of question / ticket
    // 
    /*********************************************/ 
    
    
    initQuestionPage: function () {
        if (! Application.checkConnection())    return;
        ajaxing = true; 
        var $lng = $("#app-language").val();
        var $url = $PSserver + 'services/atx_ticketcategory/' + $lng ;
        var quesOpt = '<option value="" selected>Select category<\/option>';
        jsonRequest=$.jsonp({  callbackParameter:'callback', 
                   type: 'GET',
                   url: $url,
                   async:false,
                   timeout:20000,
                   dataType: 'jsonp',
                   contentType:"application/json",
                   
                   jsonpCallback:'callback',
                   beforeSend: function () {
                       $.mobile.loading('show');
                   },
                   complete: function () {
                       ajaxing = false;
                       $.mobile.loading('hide');
                       console.log('Ticket Category:ajax Complete');
                   },
                   success: function (data, status) {
                        if (data.length < 1 || data['rows'].length < 1) {
                           navigator.notification.alert('Ticket Category not found.', function () {
                           }, 'Error');
                           
                           return;
                       }
                       $.each(data['rows'], function(i, row) {
                           $.each(row, function(key, value) {
                               quesOpt += '<option value="' + value.tid + '" >' + value.name + '<\/option> ';
                           });
                       });
                       $('#atx-question-category').empty();
                       $('#atx-question-category').append(quesOpt);
                       
                   },
                   error: function (e, textStatus) {
                     Application.showError (e, textStatus);
                   }
               });    
        

    },

    /**********************************************/
    // initCategoryPage();
    //
    // Load Categories of FAQ
    // 
    /*********************************************/ 
    

    initCategoryPage: function () {
        if (! Application.checkConnection()) return;
        if (ajaxing) return; 
        
        var $List = $('#category-list');
        var $lng = $("#app-language").val();
        
        var $url = $PSserver + 'services/atx_faqcategory/' + $lng ;
        var htmlItems = '';
        loadCategory = 0;
        //$List.empty();
        ajaxing = true;
        jsonRequest=$.jsonp({  callbackParameter:'callback', 
                   type: 'GET',
                   url: $url,
                   async:false,
                   timeout:20000,
                   dataType: 'jsonp',
                   contentType:"application/json",
                   jsonpCallback:'callback',
                   beforeSend: function () {
                       $.mobile.loading('show');
                       fetchdata = false;
                   },
                   complete: function () {
                       $.mobile.loading('hide');
                       ajaxing = false;
                       console.log('Category:ajax Complete');
                       //if (fetchdata == false) return;                       
                   },

                   success: function (data, status) { 
                       if (data.length < 1 || data['rows'].length < 1) {
                           navigator.notification.alert('Topics category not available.', function () {
                           }, 'Error');
                           $.mobile.changePage("#home-page", { transition: "fade", changeHash: true });
                           return;
                       }
                       fetchdata = true;
                       $.each(data['rows'], function(i, row) {
                           $.each(row, function(key, value) {
                               htmlItems +='<li><a class="categotyItem" data-transition="fade"  tid=' + value.tid + ' tname=' + value.name + '  href="#faq-list-page">' + value.name + '</a></li>';
                           });
                       });
                       $List.empty(); 
                       $List.append(htmlItems);
                       if ($List.hasClass('ui-listview')) {
                           $List.listview('refresh');
                       } else {
                           $List.trigger('create');
                       }
                       var d = new Date();
                       loadCategory = d.getTime(); 
                      
                   },
                   error: function (e, textStatus) {
                     Application.showError (e, textStatus);
                   }
               });

        $(document).off("vclick", '.categotyItem').on("vclick", '.categotyItem', function(event) {
            event.preventDefault();
             if (ajaxing)
            { 
               return;
            }  
            
            var $tid = $(this).attr("tid") ;
            var $tname = $(this).attr("tname") ;
            $('.category-name').text($tname);
            //  $('.faq-detail-category').text($tname);
            category = $tname;
            Application.initFaqsListPage($tid);
        });
    },

    /**********************************************/
    // initFaqDetailPage();
    //
    // Load faq on the basis of node id
    // 
    /*********************************************/  
    
    
    initFaqDetailPage: function ($nid) {
        
 
        
        
        if (! Application.checkConnection()) return;
        if (ajaxing) return; 
       
        var $body = $('.node-body');
        var $title = $('.node-title');
        var $lng = $("#app-language").val();
        var $url = $PSserver + 'services/atx_showfaq/' + $nid;
     //   ajaxing = true;
        jsonRequest=$.jsonp({  callbackParameter:'callback', 
                   type: 'GET',
                   url: $url,
                   async:false,
                   timeout:20000,
                   dataType: 'jsonp',
                   contentType:"application/json",
                   jsonpCallback:'callback',
                   beforeSend: function () {
                       $.mobile.loading('show');
                       fetchdata = false;
                   },
                   complete: function () {
                       $.mobile.loading('hide');
                       ajaxing = false;
                       if (fetchdata == false)
                           return;
                       //   $.mobile.changePage("#faq-detail-page" , { transition: "slide", changeHash: true });
                       $.mobile.changePage("faq-detail-page.html?nid=" + $nid, { transition: "fade", changeHash: true });
                       console.log('FaqDetail:ajax Complete');
                   },

                   success: function (data, status) {
                       if (data.length < 1 || data['rows'].length < 1) {
                           navigator.notification.alert("Question's detail not available.", function () {
                           }, 'Error');
                        
                           return;
                       }
                       fetchdata = true;
                       $.each(data['rows'], function(i, row) {
                           $.each(row, function(key, value) {
                               $title.html(value.title);
                               $body.html(value.body);
                               return false;
                           });
                       });
                   },
            
                    error: function (e, textStatus) {
                     Application.showError (e, textStatus);
                   }
               });
    },
    
    /**********************************************/
    // initFaqsListPage();
    //
    // Load faq list on the basis of term id
    // 
    /*********************************************/  

    initFaqsListPage: function ($tid) {
        if (! Application.checkConnection())
            return;
      //  if (ajaxing) return; 
        var $List = $('.faqs-list');
        var $lng = $("#app-language").val();
        var $url = $PSserver + 'services/atx_faqlist/' + $tid + '/' + $lng ;
        var htmlItems = '';
        $List.empty();
        ajaxing = true;
        jsonRequest=$.jsonp({  callbackParameter:'callback', 
                   type: 'GET',
                   url: $url,
                   async:false,
                   timeout:20000,
                   dataType: 'jsonp',
                   contentType:"application/json",
                   jsonpCallback:'callback',
                   beforeSend: function () {
                       $.mobile.loading('show');
                       fetchdata = false;
                   },
                   complete: function () {
                       $.mobile.loading('hide');
                       ajaxing = false;
                       if (fetchdata == false)
                           return;
                       $.mobile.changePage("#faq-list-page", { transition: "fade", changeHash: true });
                       console.log('FaqList:ajax Complete');
                   },

                   success: function (data, status) {
                       if (data.length < 1 || data['rows'].length < 1) {
                           //$.mobile.changePage("#browsetopic-page", { transition: "fade", changeHash: true });
                           navigator.notification.alert('Unable to retrieve the Topic list.', function () {
                           }, 'Error');
                           
                           return;
                       }
                       fetchdata = true;
                       $.each(data['rows'], function(i, row) {
                           $.each(row, function(key, value) {
                               htmlItems +='<li><a data-ajax= "false"  nid="' + value.nid + '" class="nodeItem" data-transition="fade" href="#faq-detail-page"><h2>' + value.title + '</h2><p>' + value.Question + '</p></a></li>';
                               //htmlItems +='<li><a  nid="' + value.nid + '" class="nodeItemExt" data-transition="flip" href="faq-detail-page.html?nid=' + value.nid +  '"><h2>' + value.title + '</h2><p>' + value.Question + '</p></a></li>';                               
                           });
                       });
 					   $List.empty();
                       $List.append(htmlItems);
                       if ($List.hasClass('ui-listview')) {
                           $List.listview('refresh');
                       } else {
                           $List.trigger('create');
                       }
                   },
                   error: function (e, textStatus) {
                      Application.showError (e, textStatus);
                   }
               });

        $(document).off("vclick", '.nodeItem').on("vclick", '.nodeItem', function(event) {
            
            if (ajaxing)
            { 
               return;
            }  
            
            
            event.preventDefault();
            var $nid = $(this).attr("nid") ;
            Application.initFaqDetailPage($nid);
        });
    },

    
    
    
    
    /**********************************************/
    // initHomePage();
    //
    // Load random faq at home page
    // Currently not in used
    /*********************************************/  
    
    
    
    
    initHomePage: function () {
     //   if (ajaxing) return; 
        var $List = $('#home-faqlist');
        var $lng = $("#app-language").val();
        var $homelistlimit = 4;
        if ($(window).height() > 480) {
            $homelistlimit = 6;
        }
           
        var $url = $PSserver + 'services/atx_faqRnd/' + $lng;
        var htmlItems = '';
        ajaxing = true;
        jsonRequest=$.jsonp({  callbackParameter:'callback', 
                   type: 'GET',
                   url: $url,
                   timeout:20000,
                   async:false,
                   dataType: 'jsonp',
                   contentType:"application/json",
                   jsonpCallback:'callback',
                   beforeSend: function () {
                       $.mobile.loading('show');
                   },
                   complete: function () {
                       ajaxing = false;
                       $.mobile.loading('hide');
                       console.log('Home:Ajax Complete');
                   },
                   success: function (data, status) {
                       if (data.length < 1 || data['rows'].length < 1) {
                           navigator.notification.alert('Unable to retrieve the FAQ.', function () {
                           }, 'Error');
                           return;
                       }
                       var counter = 0;
                       $.each(data['rows'], function(i, row) {
                           $.each(row, function(key, value) {
                               if (counter == $homelistlimit)
                                   return false;
                               counter++;
                               htmlItems +='<li><a nid="' + value.nid + '" class="nodeHomeItem" data-transition="fade" href="#faq-detail-page"><h2>' + value.title + '</h2></a></li>';
                           });
                       });
                       $List.empty();
                       $List.append(htmlItems);
                       if ($List.hasClass('ui-listview')) {
                           $List.listview('refresh');
                       } else {
                           $List.trigger('create');
                       }
                   },
                    error: function (e, textStatus) {
                     Application.showError (e, textStatus);
                   }
               });

        $(document).on("click", '.nodeHomeItem', function(event) {
            
            event.preventDefault();
            
            if (ajaxing)
            { 
               return;
            }  
            
            var $nid = $(this).attr("nid")  ;
            var $title = $(this).text();
            $('#node-title').text($title);
            Application.initFaqDetailPage($nid);
        });
    },

    checkConnection: function () {
        
        
        if (isDevice === true) {
            if (navigator.connection.type === Connection.NONE) {
                navigator.notification.alert('Please check your network connection', function () {
                }, 'Connection error');
                $.mobile.changePage("#home-page", { transition: "fade", changeHash: true });
                return false;
            }
        }
        return true;
    },
      
    showError: function (e, textStatus) {
        if (textStatus == 'timeout') {    
           navigator.notification.alert('Unable to connect with server please try again.', function () {  }, 'Error');        
        }
        else if(textStatus == 'error')
        {
           navigator.notification.alert('An error occured, Please try again.', function () { }, 'Error');    
        }
        console.log(e.message);  
        
    },
    
    loadCountry: function() {
              var country = {"af": "Afghanistan" ,"ax": "Aland Islands", "al": "Albania" ,"dz": "Algeria" ,"as": "American Samoa" ,"ad": "Andorra" ,"ao": "Angola" ,"ai": "Anguilla" ,"aq": "Antarctica" ,"ag": "Antigua and Barbuda" ,"ar": "Argentina" ,"am": "Armenia" ,"aw": "Aruba" ,"au": "Australia" ,"at": "Austria" ,"az": "Azerbaijan" ,"bs": "Bahamas" ,"bh": "Bahrain" ,"bd": "Bangladesh" ,"bb": "Barbados" ,"by": "Belarus" ,"be": "Belgium" ,"bz": "Belize" ,"bj": "Benin" ,"bm": "Bermuda" ,"bt": "Bhutan" ,"bo": "Bolivia" ,"ba": "Bosnia and Herzegovina" ,"bw": "Botswana" ,"bv": "Bouvet Island" ,"br": "Brazil" ,"io": "British Indian Ocean Territory" ,"vg": "British Virgin Islands" ,"bn": "Brunei" ,"bg": "Bulgaria" ,"bf": "Burkina Faso" ,"bi": "Burundi" ,"kh": "Cambodia" ,"cm": "Cameroon" ,"ca": "Canada" ,"cv": "Cape Verde" ,"ky": "Cayman Islands" ,"cf": "Central African Republic" ,"td": "Chad" ,"cl": "Chile" ,"cn": "China" ,"cx": "Christmas Island" ,"cc": "Cocos (Keeling) Islands" ,"co": "Colombia" ,"km": "Comoros" ,"cg": "Congo (Brazzaville)" ,"cd": "Congo (Kinshasa)" ,"ck": "Cook Islands" ,"cr": "Costa Rica" ,"hr": "Croatia" ,"cu": "Cuba" ,"cy": "Cyprus" ,"cz": "Czech Republic" ,"dk": "Denmark" ,"dj": "Djibouti" ,"dm": "Dominica" ,"do": "Dominican Republic" ,"tl": "East Timor" ,"ec": "Ecuador" ,"eg": "Egypt" ,"sv": "El Salvador" ,"gq": "Equatorial Guinea" ,"er": "Eritrea" ,"ee": "Estonia" ,"et": "Ethiopia" ,"fk": "Falkland Islands" ,"fo": "Faroe Islands" ,"fj": "Fiji" ,"fi": "Finland" ,"fr": "France" ,"gf": "French Guiana" ,"pf": "French Polynesia" ,"tf": "French Southern Territories" ,"ga": "Gabon" ,"gm": "Gambia" ,"ge": "Georgia" ,"de": "Germany" ,"gh": "Ghana" ,"gi": "Gibraltar" ,"gr": "Greece" ,"gl": "Greenland" ,"gd": "Grenada" ,"gp": "Guadeloupe" ,"gu": "Guam" ,"gt": "Guatemala" ,"gg": "Guernsey" ,"gn": "Guinea" ,"gw": "Guinea-Bissau" ,"gy": "Guyana" ,"ht": "Haiti" ,"hm": "Heard Island and McDonald Islands" ,"hn": "Honduras" ,"hk": "Hong Kong S.A.R., China" ,"hu": "Hungary" ,"is": "Iceland" ,"in": "India" ,"id": "Indonesia" ,"ir": "Iran" ,"iq": "Iraq" ,"ie": "Ireland" ,"im": "Isle of Man" ,"il": "Israel" ,"it": "Italy" ,"ci": "Ivory Coast" ,"jm": "Jamaica" ,"jp": "Japan" ,"je": "Jersey" ,"jo": "Jordan" ,"kz": "Kazakhstan" ,"ke": "Kenya" ,"ki": "Kiribati" ,"kw": "Kuwait" ,"kg": "Kyrgyzstan" ,"la": "Laos" ,"lv": "Latvia" ,"lb": "Lebanon" ,"ls": "Lesotho" ,"lr": "Liberia" ,"ly": "Libya" ,"li": "Liechtenstein" ,"lt": "Lithuania" ,"lu": "Luxembourg" ,"mo": "Macao S.A.R., China" ,"mk": "Macedonia" ,"mg": "Madagascar" ,"mw": "Malawi" ,"my": "Malaysia" ,"mv": "Maldives" ,"ml": "Mali" ,"mt": "Malta" ,"mh": "Marshall Islands" ,"mq": "Martinique" ,"mr": "Mauritania" ,"mu": "Mauritius" ,"yt": "Mayotte" ,"mx": "Mexico" ,"fm": "Micronesia" ,"md": "Moldova" ,"mc": "Monaco" ,"mn": "Mongolia" ,"me": "Montenegro" ,"ms": "Montserrat" ,"ma": "Morocco" ,"mz": "Mozambique" ,"mm": "Myanmar" ,"na": "Namibia" ,"nr": "Nauru" ,"np": "Nepal" ,"nl": "Netherlands" ,"nc": "New Caledonia" ,"nz": "New Zealand" ,"ni": "Nicaragua" ,"ne": "Niger" ,"ng": "Nigeria" ,"nu": "Niue" ,"nf": "Norfolk Island" ,"mp": "Northern Mariana Islands" ,"kp": "North Korea" ,"no": "Norway" ,"om": "Oman" ,"pk": "Pakistan" ,"pw": "Palau" ,"ps": "Palestinian Territory" ,"pa": "Panama" ,"pg": "Papua New Guinea" ,"py": "Paraguay" ,"pe": "Peru" ,"ph": "Philippines" ,"pn": "Pitcairn" ,"pl": "Poland" ,"pt": "Portugal" ,"pr": "Puerto Rico" ,"qa": "Qatar" ,"re": "Reunion" ,"ro": "Romania" ,"ru": "Russia" ,"rw": "Rwanda" ,"sh": "Saint Helena" ,"kn": "Saint Kitts and Nevis" ,"lc": "Saint Lucia" ,"pm": "Saint Pierre and Miquelon" ,"vc": "Saint Vincent and the Grenadines" ,"ws": "Samoa" ,"sm": "San Marino" ,"st": "Sao Tome and Principe" ,"sa": "Saudi Arabia" ,"sn": "Senegal" ,"rs": "Serbia" ,"cs": "Serbia And Montenegro" ,"sc": "Seychelles" ,"sl": "Sierra Leone" ,"sg": "Singapore" ,"sk": "Slovakia" ,"si": "Slovenia" ,"sb": "Solomon Islands" ,"so": "Somalia" ,"za": "South Africa" ,"gs": "South Georgia and the South Sandwich Islands" ,"kr": "South Korea" ,"es": "Spain" ,"lk": "Sri Lanka" ,"sd": "Sudan" ,"sr": "Suriname" ,"sj": "Svalbard and Jan Mayen" ,"sz": "Swaziland" ,"se": "Sweden" ,"ch": "Switzerland" ,"sy": "Syria" ,"tw": "Taiwan" ,"tj": "Tajikistan" ,"tz": "Tanzania" ,"th": "Thailand" ,"tg": "Togo" ,"tk": "Tokelau" ,"to": "Tonga" ,"tt": "Trinidad and Tobago" ,"tn": "Tunisia" ,"tr": "Turkey" ,"tm": "Turkmenistan" ,"tc": "Turks and Caicos Islands" ,"tv": "Tuvalu" ,"vi": "U.S. Virgin Islands" ,"ug": "Uganda" ,"ua": "Ukraine" ,"ae": "United Arab Emirates" ,"uk": "United Kingdom" ,"us": "United States" ,"um": "United States Minor Outlying Islands" ,"uy": "Uruguay" ,"uz": "Uzbekistan" ,"vu": "Vanuatu" ,"va": "Vatican" ,"ve": "Venezuela" ,"vn": "Vietnam" ,"wf": "Wallis and Futuna" ,"eh": "Western Sahara" ,"ye": "Yemen" ,"zm": "Zambia" ,"zw": "Zimbabwe"};

        //var country = {"AF" : "Afghanistan", "AL" : "Albania", "DZ" : "Algeria", "AS" : "American Samoa", "AD" : "Andorra", "AO" : "Angola", "AI" : "Anguilla", "AQ" : "Antarctica", "AG" : "Antigua and Barbuda", "AR" : "Argentina", "AM" : "Armenia", "AW" : "Aruba", "AU" : "Australia", "AT" : "Austria", "AZ" : "Azerbaijan", "BS" : "Bahamas", "BH" : "Bahrain", "BD" : "Bangladesh", "BB" : "Barbados", "BY" : "Belarus", "BE" : "Belgium", "BZ" : "Belize", "BJ" : "Benin", "BM" : "Bermuda", "BT" : "Bhutan", "BO" : "Bolivia", "BA" : "Bosnia and Herzegovina", "BW" : "Botswana", "BV" : "Bouvet Island", "BR" : "Brazil", "IO" : "British Indian Ocean Territory", "BN" : "Brunei Darussalam", "BG" : "Bulgaria", "BF" : "Burkina Faso", "BI" : "Burundi", "KH" : "Cambodia", "CM" : "Cameroon", "CA" : "Canada", "CV" : "Cape Verde", "KY" : "Cayman Islands", "CF" : "Central African Republic", "TD" : "Chad", "CL" : "Chile", "CN" : "China", "CX" : "Christmas Island", "CC" : "Cocos (Keeling) Islands", "CO" : "Colombia", "KM" : "Comoros", "CG" : "Congo", "CD" : "Congo, the Democratic Republic of the", "CK" : "Cook Islands", "CR" : "Costa Rica", "CI" : "Cote D'Ivoire", "HR" : "Croatia", "CU" : "Cuba", "CY" : "Cyprus", "CZ" : "Czech Republic", "DK" : "Denmark", "DJ" : "Djibouti", "DM" : "Dominica", "DO" : "Dominican Republic", "EC" : "Ecuador", "EG" : "Egypt", "SV" : "El Salvador", "GQ" : "Equatorial Guinea", "ER" : "Eritrea", "EE" : "Estonia", "ET" : "Ethiopia", "FK" : "Falkland Islands (Malvinas)", "FO" : "Faroe Islands", "FJ" : "Fiji", "FI" : "Finland", "FR" : "France", "GF" : "French Guiana", "PF" : "French Polynesia", "TF" : "French Southern Territories", "GA" : "Gabon", "GM" : "Gambia", "GE" : "Georgia", "DE" : "Germany", "GH" : "Ghana", "GI" : "Gibraltar", "GR" : "Greece", "GL" : "Greenland", "GD" : "Grenada", "GP" : "Guadeloupe", "GU" : "Guam", "GT" : "Guatemala", "GN" : "Guinea", "GW" : "Guinea-Bissau", "GY" : "Guyana", "HT" : "Haiti", "HM" : "Heard Island and Mcdonald Islands", "VA" : "Holy See (Vatican City State)", "HN" : "Honduras", "HK" : "Hong Kong", "HU" : "Hungary", "IS" : "Iceland", "IN" : "India", "ID" : "Indonesia", "IR" : "Iran, Islamic Republic of", "IQ" : "Iraq", "IE" : "Ireland", "IL" : "Israel", "IT" : "Italy", "JM" : "Jamaica", "JP" : "Japan", "JO" : "Jordan", "KZ" : "Kazakhstan", "KE" : "Kenya", "KI" : "Kiribati", "KP" : "Korea, Democratic People's Republic of", "KR" : "Korea, Republic of", "KW" : "Kuwait", "KG" : "Kyrgyzstan", "LA" : "Lao People's Democratic Republic", "LV" : "Latvia", "LB" : "Lebanon", "LS" : "Lesotho", "LR" : "Liberia", "LY" : "Libyan Arab Jamahiriya", "LI" : "Liechtenstein", "LT" : "Lithuania", "LU" : "Luxembourg", "MO" : "Macao", "MK" : "Macedonia, the Former Yugoslav Republic of", "MG" : "Madagascar", "MW" : "Malawi", "MY" : "Malaysia", "MV" : "Maldives", "ML" : "Mali", "MT" : "Malta", "MH" : "Marshall Islands", "MQ" : "Martinique", "MR" : "Mauritania", "MU" : "Mauritius", "YT" : "Mayotte", "MX" : "Mexico", "FM" : "Micronesia, Federated States of", "MD" : "Moldova, Republic of", "MC" : "Monaco", "MN" : "Mongolia", "MS" : "Montserrat", "MA" : "Morocco", "MZ" : "Mozambique", "MM" : "Myanmar", "NA" : "Namibia", "NR" : "Nauru", "NP" : "Nepal", "NL" : "Netherlands", "AN" : "Netherlands Antilles", "NC" : "New Caledonia", "NZ" : "New Zealand", "NI" : "Nicaragua", "NE" : "Niger", "NG" : "Nigeria", "NU" : "Niue", "NF" : "Norfolk Island", "MP" : "Northern Mariana Islands", "NO" : "Norway", "OM" : "Oman", "PK" : "Pakistan", "PW" : "Palau", "PS" : "Palestinian Territory, Occupied", "PA" : "Panama", "PG" : "Papua New Guinea", "PY" : "Paraguay", "PE" : "Peru", "PH" : "Philippines", "PN" : "Pitcairn", "PL" : "Poland", "PT" : "Portugal", "PR" : "Puerto Rico", "QA" : "Qatar", "RE" : "Reunion", "RO" : "Romania", "RU" : "Russian Federation", "RW" : "Rwanda", "SH" : "Saint Helena", "KN" : "Saint Kitts and Nevis", "LC" : "Saint Lucia", "PM" : "Saint Pierre and Miquelon", "VC" : "Saint Vincent and the Grenadines", "WS" : "Samoa", "SM" : "San Marino", "ST" : "Sao Tome and Principe", "SA" : "Saudi Arabia", "SN" : "Senegal", "CS" : "Serbia and Montenegro", "SC" : "Seychelles", "SL" : "Sierra Leone", "SG" : "Singapore", "SK" : "Slovakia", "SI" : "Slovenia", "SB" : "Solomon Islands", "SO" : "Somalia", "ZA" : "South Africa", "GS" : "South Georgia and the South Sandwich Islands", "ES" : "Spain", "LK" : "Sri Lanka", "SD" : "Sudan", "SR" : "Suriname", "SJ" : "Svalbard and Jan Mayen", "SZ" : "Swaziland", "SE" : "Sweden", "CH" : "Switzerland", "SY" : "Syrian Arab Republic", "TW" : "Taiwan, Province of China", "TJ" : "Tajikistan", "TZ" : "Tanzania, United Republic of", "TH" : "Thailand", "TL" : "Timor-Leste", "TG" : "Togo", "TK" : "Tokelau", "TO" : "Tonga", "TT" : "Trinidad and Tobago", "TN" : "Tunisia", "TR" : "Turkey", "TM" : "Turkmenistan", "TC" : "Turks and Caicos Islands", "TV" : "Tuvalu", "UG" : "Uganda", "UA" : "Ukraine", "AE" : "United Arab Emirates", "UK" : "United Kingdom", "US" : "United States", "UM" : "United States Minor Outlying Islands", "UY" : "Uruguay", "UZ" : "Uzbekistan", "VU" : "Vanuatu", "VE" : "Venezuela", "VN" : "Viet Nam", "VG" : "Virgin Islands, British", "VI" : "Virgin Islands, U.s.", "WF" : "Wallis and Futuna", "EH" : "Western Sahara", "YE" : "Yemen", "ZM" : "Zambia", "ZW" : "Zimbabwe" };
        var str = '';
        for (var c in country) {
            str += '<option value="' + c + '">' + country[c] + '</option>';
        }
        $("#atx-country").append(str);
    },
/*
    loadAge: function() {
        var str = '';
        for (var counter = 4; counter <= 70; counter++) {
            str += '<option value="' + counter + '">' + counter + '</option>';
        }
        $("#atx-age").append(str);
    }
    ,*/

    _setDbValues: function() {
        var data = { };
        data['name'] = $('#atx-name').val().trim();
        data['email'] = $('#atx-email').val().trim();
        data['age'] = parseInt( $('#atx-age').val().trim());
        var age=  $('#atx-age').val().trim();
        data['country'] = $('#atx-country').val().trim();
      
        data['is_teacher'] = $('input[name=atx-is_teacher]:checked', '#atx-form').val()
        //  data['is_teacher'] = ($("#atx-is_teacher").is(':checked'))?1:0;

        localStorage.setItem('userProfile', JSON.stringify(data));

        data['question'] = $('#atx-question').val().trim();
        data['category'] = $('#atx-question-category').val().trim();
        if (isDevice == true) {
            if (data['name'] === '') {
                navigator.notification.alert('Name field is required and cannot be empty', function () { }, 'Error');
                return false;
            }
            if (!Application.validateName(data['name'])) {
                navigator.notification.alert('Invalid Name', function () { }, 'Error');
                return false;
            } 
            if (data['age'] === '' ) {
                navigator.notification.alert('Invalid Age, Please select your age', function () { }, 'Error');
                return false;
            }     
            if (data['age'] > 70) {
                navigator.notification.alert('Invalid Age, Age should be less than 70', function () {  }, 'Error');
                return false;
            } 
            if ( data['age'] < 4) {
                navigator.notification.alert('Invalid Age, Age should be greater than 4', function () {  }, 'Error');
                return false;
            } 
         
            if(isNaN(age) || age.indexOf(".") >= 0)
            {
                navigator.notification.alert('Invalid Age, Age should be integer', function () {   }, 'Error');
                return false;
            }
            
            if (data['email'] === '') {
                navigator.notification.alert('Email field is required and cannot be empty', function () {
                }, 'Error');
                return false;
            }
            if (!Application.validateEmail(data['email'])) {
                navigator.notification.alert('Invalid email address', function () {
                }, 'Error');
                return false;
            }
            if (data['country'] === '') {
                navigator.notification.alert('Invalid Country, Please select your country', function () {
                }, 'Error');
                return false;
            }
            if (data['question'] === '') {
                navigator.notification.alert('Question is required and cannot be empty', function () {
                }, 'Error');
                return false;
            } 
            if (data['category'] === '') {
                navigator.notification.alert('Invalid Category, Please select question category', function () {
                }, 'Error');
                return false;
            }

        
            data['deviceModel'] = device.model ;
            data['deviceUuid'] = device.uuid;
            data['devicePlatform'] = device.platform;
            data['deviceVersion'] = device.version;
        } else {
            if (data['name'] === '') {
                alert('Name field is required and cannot be empty');
                return false;
            }
                     
  			if (!Application.validateName(data['name'])) {
                alert('Invalid Name');
                return false;
            } 
            
            if (data['country'] === '') {
                alert('Invalid Country, Please select your country');
                return false;
            }            
            if (data['email'] === '') {
                alert('Email field is required and cannot be empty');
                return false;
            }
            if (!Application.validateEmail(data['email'])) {
                alert('Invalid email address');
                return false;
            }
       
            if (data['age'] === '') {
                alert('Invalid Age, Please select your age');
                return false;
            }

            data['deviceModel'] = 'n/d';
            data['deviceUuid'] = 'n/d';
            data['devicePlatform'] = 'browser';
            data['deviceVersion'] = 'n/d';
        }
        return data;
    },

    _getDbValues: function() {
        if (localStorage.getItem('userProfile') != undefined) {
            var data = localStorage.getItem('userProfile');
            var items = JSON.parse(data)  ;

            if (items.name != undefined) {
                $("#atx-name").val(items.name);
            }
            
            if (items.email != undefined) {
                result = document.getElementById("atx-email");
                result.value = items.email;
            } /*
            if (items.age != undefined) {
                $('#atx-age').val(items.age).selectmenu("refresh");
             
            } */
            if (items.age != undefined) {
                $('#atx-age').val(items.age)
            }       
            
            
            if (items.country != undefined) {
                $('#atx-country').val(items.country).selectmenu("refresh");
            }
            else
            {
                
                
            }
            
            
            if (items.is_teacher != undefined) {
                $("input[name=atx-is_teacher][value=" + items.is_teacher + "]").prop('checked', true).refresh;
                //   $('#atx-is_teacher').prop('checked', items.is_teacher);
            }
        }
    } ,


    validateEmail: function (email) {
        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

        if (reg.test(email) == false) {
            return false;
        }
 
        return true;
    } ,

   validateName: function (name) {
        var reg = /^[a-zA-Z][a-zA-Z0-9-_\.\s]{1,25}$/;

        if (reg.test(name) == false) {
            return false;
        }
 
        return true;
    } ,
    
};

// create seasons array and and repeat ajax call until all results are returned
function callback(result) {
    //	console.log(result);
}