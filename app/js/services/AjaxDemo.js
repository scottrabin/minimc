'use strict';

define(
[
	'when',
	'underscore',
], function(when, _) {

	var playerSpeed = 0;
	var playerTime = {};
	var totalTime = getTime(2400);
	var currentItem;

	function get_result(command, params) {
		var match = _.find(RETURN_VARS[command], function(item) {
			return (typeof item.when == 'function' ? item.when(params) : item.when);
		});
		var result = (match ? match.result : {error : "No stubbed method exists"});
		if (typeof result == 'function') {
			result = result(params);
		}
		return result;
	}

	function fromTime(time) {
		return time.hours * 3600 + time.minutes * 60 + time.seconds;
	}

	function getTime(seconds) {
		return {
			hours : Math.floor(seconds / 3600),
			minutes : Math.floor((seconds % 3600) / 60),
			seconds : Math.floor(seconds % 60)
		}
	}

	setInterval(function() {
		playerTime = getTime(fromTime(playerTime) + playerSpeed);
	}, 1000);

	var RETURN_VARS = {
		"Player.PlayPause" : [
			{
				when : true,
				result : function() {
					playerSpeed = (playerSpeed === 1 ? 0 : 1);
					return { playerid : 1, speed : playerSpeed };
				}
			}
		],
		"Player.Open" : [
			{
				when : true,
				result : function(params) {
					var collection = (params.item.movieid ?
									  get_result('VideoLibrary.GetMovies').movies :
									  get_result('VideoLibrary.GetEpisodes', { tvshowid : Math.floor((params.item.episodeid - 1) / 9) + 1 }).episodes);
					currentItem = _.findWhere( collection, params.item );
					playerTime = getTime(0);
					playerSpeed = 1;

					return {};
				}
			}
		],
		"Player.GetProperties" : [
			{
				when : true,
				result : function(params) {
					return { playerid : 1, speed : playerSpeed, time : playerTime, totaltime : totalTime };
				}
			}
		],
		"Player.GetItem" : [
			{
				when : true,
				result : function() {
					return { item : currentItem };
				}
			}
		],
		"Player.GetActivePlayers" : [
			{
				when : true,
				result : [{playerid : 1, type : 'video' }]
			}
		],
		"VideoLibrary.GetMovies" : [
			{
				when : true,
				result : {
					movies : [
						{ movieid : 1, year : 1985, title : 'Clue',
							art : { poster : 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185/suzDcrxpuNPDnBwOOy8vBLsygwp.jpg' },
							plot : "Clue finds six colorful dinner guests gathered at the mansion of their host, Mr. Boddy -- who turns up dead after his secret is exposed: He was blackmailing all of them. With the killer among them, the guests and Boddy's chatty butler must suss out the culprit before the body count rises.",
							cast : [{"name":"Lesley Ann Warren","role":"Miss Scarlet"},{"name":"Christopher Lloyd","role":"Professor Plum"},{"name":"Eileen Brennan","role":"Mrs. Peacock"},{"name":"Tim Curry","role":"Wadsworth"},{"name":"Madeline Kahn","role":"Mrs. White"},{"name":"Martin Mull","role":"Colonel Mustard"},{"name":"Michael McKean","role":"Mr. Green"},{"name":"Colleen Camp","role":"Yvette"},{"name":"Lee Ving","role":"Mr. Boddy"},{"name":"Bill Henderson","role":"The Cop"},{"name":"Jane Wiedlin","role":"The Singing Telegram"}]
						},
						{ movieid : 2, year : 2009, title : 'District 9',
							art : { poster : 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185/axFmCRNQsW6Bto8XuJKo08MPPV5.jpg' },
							plot : "Aliens land in South Africa and have no way home. Years later after living in a slum and wearing out their welcome the \"Non-Humans\" are being moved to a new tent city overseen by Multi-National United (MNU). The movie follows an MNU employee tasked with leading the relocation and his relationship with one of the alien leaders.",
							cast : [{"name":"William Allen Young","role":"Dirk Michaels"},{"name":"Robert Hobbs","role":"Ross Pienaar"},{"name":"Sharlto Copley","role":"Wikus van der Merwe"},{"name":"Jason Cope","role":"Grey Bradnam"},{"name":"Vanessa Haywood","role":"Tania Van De Merwe"},{"name":"Kenneth Nkosi","role":"Thomas"}]
						},
						{ movieid : 3, year : 2002, title : 'Harry Potter and the Chamber of Secrets',
							art : { poster : 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185/lryNn7sNkvQIg45KwgeKnMxSSRX.jpg' },
							plot : "Everyone's favorite novice wizard, Harry Potter, continues his high-flying adventures at Hogwarts. This time around, Harry ignores warnings not to return to school - that is, if he values his life - to investigate a mysterious series of attacks with Ron and Hermione.",
							cast : [{"name":"Daniel Radcliffe","role":"Harry Potter"},{"name":"Rupert Grint","role":"Ron Weasley"},{"name":"Emma Watson","role":"Hermione Granger"},{"name":"Martin Bayfield","role":"Young Rubeus Hagrid"},{"name":"Heather Bleasdale","role":"Mrs Granger"},{"name":"Sean Biggerstaff","role":"Oliver Wood"},{"name":"David Bradley","role":"Argus Filch"},{"name":"Kenneth Branagh","role":"Gilderoy Lockhart"},{"name":"Veronica Clifford","role":"Mrs Mason"},{"name":"John Cleese","role":"Nearly Headless Nick"},{"name":"Robbie Coltrane","role":"Rubeus Hagrid"},{"name":"Eleanor Columbus","role":"Susan Bones"},{"name":"Christian Coulson","role":"Tom Marvolo Riddle"},{"name":"Warwick Davis","role":"Filius Flitwick"},{"name":"Emily Dale","role":"Katie Bell"},{"name":"Rochelle Douglas","role":"Alicia Spinnet"},{"name":"Richard Griffiths","role":"Uncle Vernon Dursley"},{"name":"Julie Walters","role":"Molly Weasley"},{"name":"Matthew Lewis","role":"Neville Longbottom"},{"name":"Alan Rickman","role":"Severus Snape"},{"name":"Richard Harris","role":"Albus Dumbledore"},{"name":"Tom Felton","role":"Draco Malfoy"},{"name":"Leslie Phillips","role":"The Sorting Hat (voice)"},{"name":"Jason Isaacs","role":"Lucius Malfoy"},{"name":"Maggie Smith","role":"Professor Minerva McGonagall"}]
						},
						{ movieid : 4, year : 1992, title : 'My Cousin Vinny',
							art : { poster : 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185/2lhWjSkRHZREw5wXoWHO88lpODe.jpg' },
							plot : "Two carefree pals traveling through Alabama are mistakenly arrested, and charged with murder. Fortunately, one of them has a cousin who's a lawyer - Vincent Gambini, a former auto mechanic from Brooklyn who just passed his bar exam after his sixth try. When he arrives with his leather-clad girlfriend , to try his first case, it's a real shock - for him and the Deep South!",
							cast : [{"name":"Joe Pesci","role":"Vincent 'Vinny' Gambini"},{"name":"Ralph Macchio","role":"William 'Billy' Gambini"},{"name":"Marisa Tomei","role":"Mona Lisa Vito"},{"name":"Mitchell Whitfield","role":"Stan Rothenstein"},{"name":"Fred Gwynne","role":"Judge Chamberlain Haller"}]
						},
						{ movieid : 5, year : 2005, title : 'Serenity',
							art : { poster : 'http://d3gtl9l2a4fn1j.cloudfront.net/t/p/w185/iaE3I86DtOfb8a1Kmsko3Gbr6fq.jpg' },
							plot : "When the renegade crew of Serenity agrees to hide a fugitive on their ship, they find themselves in an action-packed battle between the relentless military might of a totalitarian regime who will destroy anything - or anyone - to get the girl back and the bloodthirsty creatures who roam the uncharted areas of space. But, the greatest danger of all may be on their ship.",
							cast : [{"name":"Nathan Fillion","role":"Mal"},{"name":"Gina Torres","role":"Zoe"},{"name":"Alan Tudyk","role":"Wash"},{"name":"Morena Baccarin","role":"Inara"},{"name":"Adam Baldwin","role":"Jayne"},{"name":"Jewel Staite","role":"Kaylee"},{"name":"Sean Maher","role":"Simon"},{"name":"Summer Glau","role":"River"},{"name":"Ron Glass","role":"Shepherd Book"},{"name":"Chiwetel Ejiofor","role":"The Operative"},{"name":"David Krumholtz","role":"Mr. Universe"},{"name":"Michael Hitchcock","role":"Dr. Mathias"},{"name":"Sarah Paulson","role":"Dr. Caron"},{"name":"Yan Feldman","role":"Mingo"},{"name":"Rafael Feldman","role":"Fanty"},{"name":"Nectar Rose","role":"Lenore"},{"name":"Tamara Taylor","role":"Teacher"},{"name":"Glenn Howerton","role":"Lilac Young Tough"},{"name":"Hunter Ansley Wryn","role":"Young River"},{"name":"Logan O'Brien","role":"Boy Student"},{"name":"Erik Erotas","role":"Boy Student"},{"name":"Demetra Raven","role":"Girl Student"},{"name":"Jessica Huang","role":"Girl Student"},{"name":"Marley McClean","role":"Girl Student"},{"name":"Scott Kinworthy","role":"Ensign"},{"name":"Erik Weiner","role":"Helmsman"},{"name":"Conor O'Brien","role":"Lab Technician"},{"name":"Peter James Smith","role":"Lab Technician"},{"name":"Weston Nathanson","role":"Trade Agent"},{"name":"Carrie 'CeCe' Cline","role":"Young Female Intern"},{"name":"Chuck O'Neil","role":"Vault Guard"},{"name":"Amy Wieczorek","role":"Lilac Mom"},{"name":"Tristan Jarred","role":"Lilac Son"},{"name":"Elaine Mani Lee","role":"Fan Dancer"},{"name":"Terrence Hardy Jr.","role":"Mining Camp Boy"},{"name":"Brian O'Hare","role":"Alliance Pilot"},{"name":"Ryan Tasz","role":"Black Room Soldier"},{"name":"Colin Patrick Lynch","role":"Black Room Soldier"},{"name":"Terrell Tilford","role":"News Anchor"},{"name":"Joshua Michael Kwiat","role":"Slovenly Beaumonde Man"},{"name":"Antonio Rufino","role":"Bartender"},{"name":"Linda Wang","role":"Chinese snake dancer"},{"name":"Mark Winn","role":"Futuristic Worker"}]
						},
					]
				}
			}
		],
		"VideoLibrary.GetTVShows" : [
			{
				when : true,
				result : {
					tvshows : [
						{
							art : {
								banner : 'http://thetvdb.com/banners/graphical/73255-g22.jpg'
							},
							title : 'House',
							tvshowid : 1
						},
						{
							art : {
								banner : 'http://thetvdb.com/banners/graphical/80379-g23.jpg'
							},
							title : 'The Big Bang Theory',
							tvshowid : 2
						},
						{
							art : {
								banner : 'http://thetvdb.com/banners/graphical/83462-g5.jpg'
							},
							title : 'Castle',
							tvshowid : 3
						}
					]
				}
			}
		],
		"VideoLibrary.GetSeasons" : [
			{
				when : function(data) { return data.tvshowid == 1; },
				result : {
					seasons : [
						{ season : 1, showtitle : 'House', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/73255-1-13.jpg' } },
						{ season : 2, showtitle : 'House', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/73255-2-11.jpg' } },
						{ season : 3, showtitle : 'House', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/73255-3-2.jpg' } }
					]
				}
			},
			{
				when : function(data) { return data.tvshowid == 2; },
				result : {
					seasons : [
						{ season : 1, showtitle : 'The Big Bang Theory', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/80379-1-10.jpg' } },
						{ season : 2, showtitle : 'The Big Bang Theory', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/80379-2-4.jpg' } },
						{ season : 3, showtitle : 'The Big Bang Theory', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/80379-3-7.jpg' } }
					]
				}
			},
			{
				when : function(data) { return data.tvshowid == 3; },
				result : {
					seasons : [
						{ season : 1, showtitle : 'Castle', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/83462-1.jpg' } },
						{ season : 2, showtitle : 'Castle', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/83462-2-2.jpg' } },
						{ season : 3, showtitle : 'Castle', art : { poster : 'http://thetvdb.com/banners/_cache/seasons/83462-3-5.jpg' } }
					]
				}
			}
		],
		"VideoLibrary.GetEpisodes" : [
			{
				when : function(data) { return data.tvshowid == 1; },
				result : {
					episodes : [
						{ season : 1, episode : 1, showtitle : 'House', tvshowid : 1, episodeid : 1, title : 'Pilot',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/110994.jpg' },
							plot : "A Kindergarten teacher starts speaking gibberish and passed out in front of her class. What looks like a possible brain tumor does not respond to treatment and provides many more questions than answers for House and his team as they engage in a risky trial-and-error approach to her case. When the young teacher refuses any additional variations of treatment and her life starts slipping away, House must act against his code of conduct and make a personal visit to his patient to convince her to trust him one last time.",
							cast : []
						},
						{ season : 1, episode : 2, showtitle : 'House', tvshowid : 1, episodeid : 2, title : 'Paternity',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/110995.jpg' },
							plot : "When a teenage lacrosse player is stricken with an unidentifiable brain disease, Dr. House and the team hustle to give his parents answers. Chase breaks the bad news, the kid has MS, but the boy's night-terror hallucinations disprove the diagnosis and send House and his team back to square one. As the boy's health deteriorates. House's side-bet on the paternity of the patient infuriates Dr. Cuddy and the teenager's parents, but may just pay off in spades.",
							cast : []
						},
						{ season : 1, episode : 3, showtitle : 'House', tvshowid : 1, episodeid : 3, title : 'Occam\'s Razor',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/110996.jpg' },
							plot : "A college student collapses after rowdy sex with his girlfriend.  While House and his team attempt to determine the cause, the student's condition continues to deteriorate and his symptoms multiply complicating the diagnosis.",
							cast : []
						},
						{ season : 2, episode : 1, showtitle : 'House', tvshowid : 1, episodeid : 4, title : 'Acceptance',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/306189.jpg' },
							plot : "A death row inmate is felled by an unknown disease and House decides to take on the case, over Cuddy and Foreman's objections. House also has to deal with Stacy who is working closely with him, while Cameron has to cope with a dying patient.",
							cast : []
						},
						{ season : 2, episode : 2, showtitle : 'House', tvshowid : 1, episodeid : 5, title : 'Autopsy',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/306190.jpg' },
							plot : "Dr. Wilson convinces House to take the case of one of his patients, a young girl with terminal cancer who starts suffering from hallucinations.",
							cast : []
					   	},
						{ season : 2, episode : 3, showtitle : 'House', tvshowid : 1, episodeid : 6, title : 'Humpty Dumpty',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/306191.jpg' },
							plot : "An asthmatic man suddenly becomes unconscious and falls off of Dr. Cuddy's roof while working on her house.",
							cast : []
					   	},
						{ season : 3, episode : 1, showtitle : 'House', tvshowid : 1, episodeid : 7, title : 'Meaning',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/307551.jpg' },
							plot : "After recovering from his gunshot wounds, House works feverishly on two cases at the same time: a paralyzed man who drove his wheelchair into a swimming pool and a woman who became paralyzed after a yoga session.",
							cast : []
					   	},
						{ season : 3, episode : 2, showtitle : 'House', tvshowid : 1, episodeid : 8, title : 'Cane & Able',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/307552.jpg' },
							plot : "House and the team treat a young boy who claims there is a tracking device in his neck and believes he has been the subject of alien experimentation. Cameron is outraged when she learns Cuddy and Wilson have been lying to House about the diagnosis on his last case.",
							cast : []
					   	},
						{ season : 3, episode : 3, showtitle : 'House', tvshowid : 1, episodeid : 9, title : 'Informed Consent',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/73255/307553.jpg' },
							plot : "House puts a well-known medical researcher through a battery of tests to determine why he collapsed in his lab. When the team is unable to diagnose the problem, the doctor asks the team to help him end his life. House is forced to use his cane again after the ketamine has worn off as he deals with a clinic patient's teenaged daughter who has a crush on him.",
							cast : []
					   	}
					]
				}
			},
			{
				when : function(data) { return data.tvshowid == 2; },
				result : {
					episodes : [
						{ season : 1, episode : 1, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 10, title : 'Pilot',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/332484.jpg' },
							plot : "Brilliant physicist roommates Leonard and Sheldon meet their new neighbor Penny, who begins showing them that as much as they know about science, they know little about actual living.",
							cast : []
						},
						{ season : 1, episode : 2, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 11, title : 'The Big Bran Hypothesis',
							art : { thumb : 'http://thetvdb.com/banners/episodes/80379/337065.jpg' },
							plot : "Leonard volunteers to sign for a package in an attempt to make a good impression on Penny, but when he enlists Sheldon for help, his attempt at chivalry goes terribly awry.",
							cast : []
						},
						{ season : 1, episode : 3, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 12, title : 'The Fuzzy Boots Corollary',
							art : { thumb : 'http://thetvdb.com/banners/episodes/80379/337249.jpg' },
							plot : "Leonard asks a woman out after he finds out that Penny is seeing someone.",
							cast : []
						},
						{ season : 2, episode : 1, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 13, title : 'The Bad Fish Paradigm',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/387721.jpg' },
							plot : "Penny's first date with Leonard goes awry; Penny finds Sheldon to be an unwilling confidant.",
							cast : []
						},
						{ season : 2, episode : 2, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 14, title : 'The Codpiece Topology',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/389025.jpg' },
							plot : "A jealous Leonard reacts to Penny's new guy by rebounding with Leslie.",
							cast : []
					   	},
						{ season : 2, episode : 3, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 15, title : 'The Barbarian Simulation',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/391204.jpg' },
							plot : "Sheldon creates a monster when he introduces Penny to online gaming.",
							cast : []
					   	},
						{ season : 3, episode : 1, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 16, title : 'The Electric Can Opener Fluctuation',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/795681.jpg' },
							plot : "When Sheldon learns the guys tampered with his expedition data he got from the arctic, he leaves to Texas in disgrace. This results in the guys following him, which threatens Leonard's hope for some romantic time with Penny and the guys' friendship with Sheldon.",
							cast : []
					   	},
						{ season : 3, episode : 2, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 17, title : 'The Jiminy Conjecture',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/1046141.jpg' },
							plot : "Leonard and Penny struggle to recover from an awkward first hookup while Sheldon and Howard stake their best comic books on a bet to determine the species of a cricket.",
							cast : []
					   	},
						{ season : 3, episode : 3, showtitle : 'The Big Bang Theory', tvshowid : 2, episodeid : 18, title : 'The Gothowitz Deviation',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/80379/1101931.jpg' },
							plot : "Howard and Raj visit a Goth nightclub to pick up women while Sheldon attempts to build a better Penny using chocolate-based behavior modification.",
							cast : []
					   	}
					]
				}
			},
			{
				when : function(data) { return data.tvshowid == 3; },
				result : {
					episodes : [
						{ season : 1, episode : 1, showtitle : 'Castle', tvshowid : 3, episodeid : 19, title : 'Flowers for Your Grave',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/398671.jpg' },
							plot : "Author Richard Castle joins NYC Detective Kate Beckett to help solve the case of a serial killer who is reenacting murders from Castle's novels; Castle becomes very intrigued with the murders and continues to shadow Beckett, much to her chagrin.",
							cast : []
						},
						{ season : 1, episode : 2, showtitle : 'Castle', tvshowid : 3, episodeid : 20, title : 'Nanny McDead',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/424159.jpg' },
							plot : "When a body of a young woman is found inside the dryer at a laundry room, Castle and Beckett uncover that the young woman worked as a nanny in the upscale building. Meanwhile, as Castle works on his \"Nikki Heat\" novel series he watches Beckett's actions as she works the murder case.",
							cast : []
						},
						{ season : 1, episode : 3, showtitle : 'Castle', tvshowid : 3, episodeid : 21, title : 'Hedge Fund Homeboys',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/424160.jpg' },
							plot : "When a teenaged boy whose family has recently fallen on hard times is found dead in a boat in Central Park, Castle and Beckett must piece together the mystery behind the boy's final moments. Meanwhile, Castle mulls over leaving Martha home while he chaperones Alexis' trip to Washington, D.C.",
							cast : []
						},
						{ season : 2, episode : 1, showtitle : 'Castle', tvshowid : 3, episodeid : 22, title : 'Deep in Death',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/792761.jpg' },
							plot : "When the new season begins, Castle is wrestling with how to repair his relationship with Beckett, while struggling to finish his soon-to-be-published bestseller, Heat Wave. But circumstances force the pair back together to investigate the mysterious murder of a man found dead, tangled in the limbs of a tree.",
							cast : []
						},
						{ season : 2, episode : 2, showtitle : 'Castle', tvshowid : 3, episodeid : 23, title : 'The Double Down',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/1101941.jpg' },
							plot : "When two separate murders are committed on the same night, Castle wagers Ryan and Esposito that he and Beckett will solve theirs first. The frenzied race to catch their respective killers and win the bet leads each investigative duo to a likely suspect, only to find that they both have airtight alibis. But bizarre twists in both cases force the two teams to work together to unravel the mind-bending mystery behind each murder.",
							cast : []
					   	},
						{ season : 2, episode : 3, showtitle : 'Castle', tvshowid : 3, episodeid : 24, title : 'Inventing the Girl',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/1103021.jpg' },
							plot : "Castle and Beckett get an inside look at the cutthroat world of the New York fashion industry when they investigate the brutal murder of a young model during Fashion Week.",
							cast : []
					   	},
						{ season : 3, episode : 1, showtitle : 'Castle', tvshowid : 3, episodeid : 25, title : 'A Deadly Affair',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/2432571.jpg' },
							plot : "When Beckett and her team burst into an apartment on a murderer's trail, they see Castle standing over a dead woman's body holding a gun; Beckett arrests Castle as he asserts his innocence.",
							cast : []
					   	},
						{ season : 3, episode : 2, showtitle : 'Castle', tvshowid : 3, episodeid : 26, title : 'He\'s Dead, She\'s Dead',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/2744841.jpg' },
							plot : "Beckett and Castle search for a psychic's killer while debating the existence of extrasensory abilities.",
							cast : []
					   	},
						{ season : 3, episode : 3, showtitle : 'Castle', tvshowid : 3, episodeid : 27, title : 'Under the Gun',
							art : { thumb : 'http://thetvdb.com/banners/_cache/episodes/83462/2744851.jpg' },
							plot : "When a coded document attracts Castle's attention, Beckett must steer the case back to the violent felons who populated their victim's world; when Beckett's ex-partner arrives, Castle must watch the relationship become romantic.",
							cast : []
					   	}
					]
				}
			}
		]
	};

	return {
		post : function(url, data) {
			var command = /jsonrpc\?(.*)$/.exec(url)[1];
			var result = get_result(command, data.params);
			var deferred = when.defer();
			setTimeout( function() { deferred.resolve({result : result}); }, 300);

			console.log("Command: ", command, " Params: ", data.params);
			console.log("  -> ", result);

			return deferred.promise;
		}
	};
});
