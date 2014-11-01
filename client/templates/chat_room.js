Notification.requestPermission()


Session.setDefault('picWidth', 58)
Session.setDefault('picHeight', 47)
Session.setDefault('camera.distanceFromEdge', 0)

Template.chat_room.rendered = function() {
  handleNotifications()
  Tracker.autorun(showMentions)
  Meteor.call('addToRoom', currentRoom().name, User._id)

  function handleNotifications() {
    Messages.find({ timestamp: { $gt: TimeHelper.serverTimestamp() } }).observe({
      added: function(doc) {
        if (User.nick == doc.author) {
          return;
        }
        if (Session.get('titleNotifications')) {
          document.title = doc.body
        }
        switch (Session.get('notificationsLevel')) {
          case 1:
            return null
          case 2:
            return (TimeHelper.serverTimestamp() - User.lastMsgTimestamp < 10000) ? Notifier.playSound('newMessage') : null
          case 3:
            return (TimeHelper.serverTimestamp() - User.lastMsgTimestamp < 10000) ? Notifier.notify(doc) : null
          case 4:
            return Notifier.playSound('newMessage')
          case 5:
            return Notifier.notify(doc)
          default:
            //do nothing
            return null
        }
      }
    })
  }

  function showMentions() {
    var caseInsensitiveNick = new RegExp('^' + User.nick + '$', 'i')
    var mentionsToUser = Mentions.find({ to: { $in: [caseInsensitiveNick, 'all'] }, author: { $not: { $regex: caseInsensitiveNick } } })
    mentionsToUser.forEach(Notifier.notify)
    // remove them after they are displayed.
    // Not user Mentions.remove({ to: user.nick }) because a mention can be created in the meanwhile
    mentionsToUser.forEach(function(msg) {
      Mentions.remove(msg._id)
    })
  }
}

window.onbeforeunload = function() {
  Meteor.call('kickout', currentRoom().name, User._id)
}