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
		var PlayerService;

		beforeEach(inject(function(_$httpBackend_, Player) {
			JsonRpc.$httpBackend = _$httpBackend_;
			PlayerService = Player;
		}));

		it('should automatically update when the current active player changes', function() {
			expect(PlayerService.isActive()).toBe(false);

			JsonRpc.respondWith([{ playerid : 1, type : "video" }]);
			PlayerService.autoupdate(true);
			JsonRpc.respond();

			expect(PlayerService.isActive()).toBe(true);
		});
	});
});
