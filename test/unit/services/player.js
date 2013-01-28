"use strict";

describe('services', function() {

	beforeEach(function() {
		this.addMatchers({
			toEqualData : function(expected) {
				return angular.equals(this.actual, expected);
			},
		});
	});

	beforeEach(module('wexbmc'));

	describe('Player', function() {
		var PlayerService, $httpBackend;

		beforeEach(inject(function(_$httpBackend_, Player) {
			JsonRpc.$httpBackend = $httpBackend = _$httpBackend_;
			PlayerService = Player;
		}));

		afterEach(function() {
			PlayerService.autoupdate(false);
			$httpBackend.verifyNoOutstandingRequest();
		});

		it('should automatically update when the current active player changes', function() {
			expect(PlayerService.isActive()).toBe(false);

			// First request gets the active players, and the second gets the details of that player
			JsonRpc.respondWith( [{ playerid : 1, type : "video" }] );
			JsonRpc.respondWith( [{ speed : 1 }] );
			PlayerService.autoupdate(true);
			JsonRpc.respond();

			expect(PlayerService.isActive()).toBe(true);
		});

		it('should not attempt to fetch player details if there are no active players', function() {
			JsonRpc.respondWith( [] );
			PlayerService.autoupdate(true);
			JsonRpc.respond();
		});
	});
});
