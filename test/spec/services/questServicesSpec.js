'use strict';

describe('Quests Service', function() {
  var scope, groupsService, quest, questsService, user;

  beforeEach(function() {
    user = specHelper.newUser();
    user.ops = {
      buyQuest: sandbox.spy()
    };

    user.achievements.quests = {};
    quest = {lvl:20};

    module(function($provide) {
      $provide.value('User', {user: user});
    });

    inject(function($rootScope, $controller, Quests, Groups) {
      scope = $rootScope.$new();
      $controller('RootCtrl', {$scope: scope, User: {user: user}});
      questsService = Quests;
      groupsService = Groups;
    });

    sandbox.stub(groupsService, 'inviteOrStartParty');
    sandbox.stub(scope, 'openModal');
    sandbox.stub(window,'confirm',function(){return true});
    sandbox.stub(window,'alert');
  });

  context('functions', function() {

    describe('lock quest', function() {

      it('locks quest when user does not meet level requirement', function() {
        user.stats.lvl = 15;

        expect(questsService.lockQuest(quest)).to.be.ok;
      });

      it('does not lock quest if we ignore level requirement', function() {
        user.stats.lvl = 15;

        expect(questsService.lockQuest(quest,true)).to.not.be.ok;
      });

      it('does not lock quest if user meets level requirement', function() {
        user.stats.lvl = 20;

        expect(questsService.lockQuest(quest)).to.not.be.ok;
      });

      it('locks quest if user has not completed previous quest in series', function() {
        quest.previous = 'priorQuest';
        user.stats.lvl = 25;

        expect(questsService.lockQuest(quest)).to.be.ok;
      });

      it('does not lock quest if user has completed previous quest in series', function() {
        quest.previous = 'priorQuest';
        user.stats.lvl = 25;
        user.achievements.quests.priorQuest = 1;

        expect(questsService.lockQuest(quest)).to.not.be.ok;
      });
    });

    describe('buy quest', function() {

      it('prompts user to invite friends to party for invite reward quests', function() {
        questsService.buyQuest('basilist');

        expect(window.confirm).to.have.been.calledOnce;
        expect(groupsService.inviteOrStartParty).to.have.been.calledOnce;
        expect(scope.openModal).to.have.been.notCalled;
      });

      it('does not allow user to buy quests whose previous quests are incomplete', function() {
        user.stats.lvl = 100;

        questsService.buyQuest('goldenknight2');

        expect(window.alert).to.have.been.calledOnce;
        expect(scope.openModal).to.have.been.notCalled;
      });

      it('does not allow user to buy quests beyond their level', function() {
        user.stats.lvl = 1;

        questsService.buyQuest('vice1');

        expect(window.alert).to.have.been.calledOnce;
        expect(scope.openModal).to.have.been.notCalled;
      });

      it('opens purchase modal if all prerequisites are met', function() {
        user.stats.lvl = 100;
        user.achievements.quests.atom1 = 2;

        questsService.buyQuest('atom2');

        expect(scope.selectedQuest).to.eql('atom2');
        expect(scope.openModal).to.have.been.calledOnce;
        expect(scope.openModal).to.have.been.calledWith('buyQuest');
      });

      it('calls user ops buyQuest if quest is Gold-purchasable', function() {
        questsService.buyQuest('dilatoryDistress1');

        expect(user.ops.buyQuest).to.have.been.calledOnce;
        expect(scope.openModal).to.have.been.notCalled;
      });
    });
  });
});
