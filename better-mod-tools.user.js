// ==UserScript==
// @name        Stack Exchange Moderator Tools Improved
// @description Moves the info from the post issues box and moves options out of the mod menu for easier access.
// @author      animuson
// @version     0.1.1
// @namespace   https://github.com/animuson
// @grant       none
// @match       *://*.stackexchange.com/*
// @match       *://*.stackoverflow.com/*
// @match       *://*.superuser.com/*
// @match       *://*.serverfault.com/*
// @match       *://*.askubuntu.com/*
// @match       *://*.stackapps.com/*
// @match       *://*.mathoverflow.net/*
// ==/UserScript==

$(document).ready(function(e) {
    if (StackExchange.options.user.isModerator) {
        var $posts = $('.question, .answer');
        var modMenu = { 'question': '', 'answer': '' };

        $posts.each(function() {
            var postIssues = $(this).find('.post-issue');
            var postMenu = $(this).find('.post-menu');
            var postType = $(this).hasClass('question') ? 'question' : 'answer';
            var postId = $(this).data(postType + 'id');
            var statusList = $('.' + postType + '-status');
            var statusTypes = statusList.find('h2 b').map(function() {
                return $(this).text();
            }).get();
            var hasPostNotice = (statusTypes.length != statusList.length);
            var isWiki = ($(this).find('.user-details .community-wiki').length > 0);
            var isProtected = ($.inArray('protected', statusTypes) >= 0);
            var isLocked = ($.inArray('locked', statusTypes) >= 0);
            var isClosed = ($.inArray('closed', statusTypes) >= 0 || $.inArray('on hold', statusTypes) >= 0);
            var isDeleted = ($.inArray('deleted', statusTypes) >= 0 || $(this).find('.deleted-answer-info').length > 0);
            var hasBounty = ($(this).find('.bounty-notification').length > 0);

            var modLink = postMenu.find('.post-moderator-link').detach().addClass('red-mod-link');

            var protectLink, convertLink, lockLink, mergeLink, noticeLink, wikiLink;

            postMenu.find('.deleted-post').removeClass('deleted-post'); // That styling just looks dumb

            // Re-add the protect/unprotect link for moderators
            if (postType == 'question' && !isLocked) {
                if (isProtected) {
                    protectLink = '<a id="unprotect-post-' + postId + '" data-postid="' + postId + '" href="#" class="unprotect-question-link">unprotect</a>';
                } else {
                    protectLink = '<a id="protect-post-' + postId + '" data-postid="' + postId + '" href="#" class="protect-question-link">protect</a>';
                }
                postMenu.append(protectLink);
            }

            postMenu.append('<br /><span class="lsep">|</span>');
            postMenu.append(modLink);

            // Create convert to comment/edit link
            if (postType == 'answer') {
                if (!isDeleted) {
                    convertLink = '<a id="convert-post-' + postId + '" data-postid="' + postId + '" class="convert-answer-link red-mod-link" title="conver answer to comment or edit">convert</a>';
                } else {
                    convertLink = '<span class="red-mod-disabled" title="cannot convert to comment or edit while deleted">convert</span>';
                }
                postMenu.append(convertLink);
            }

            // Creator lock/unlock link
            if (isLocked) {
                lockLink = '<a id="unlock-post-' + postId + '" data-postid="' + postId + '" class="unlock-post-link red-mod-link" title="unlock and remove post notice">unlock</a>';
            } else if (!hasPostNotice) { // Attempting to lock with an active post notice will error out - you need to remove it first
                lockLink = '<a id="lock-post-' + postId + '" data-postid="' + postId + '" class="lock-post-link red-mod-link" title="lock and add optional post notice">lock</a>';
            } else {
                lockLink = '<span class="red-mod-disabled" title="post notice must be removed before locking again">lock</span>';
            }
            postMenu.append(lockLink);

            // Create merge question link
            if (postType == 'question') {
                if (isClosed) {
                    mergeLink = '<a id="merge-post-' + postId + '" data-postid="' + postId + '" class="merge-question-link red-mod-link" title="merge duplicate into another question">merge</a>';
                } else {
                    mergeLink = '<span class="red-mod-disabled" title="question must be closed as duplicate">merge</span>';
                }
                postMenu.append(mergeLink);
            }

            // Create add/remove notice link
            if (hasPostNotice) {
                noticeLink = '<a id="unnotice-post-' + postId + '" data-postid="' + postId + '" class="unnotice-post-link red-mod-link" title="remove post notice">denotice</a>';
            } else {
                noticeLink = '<a id="notice-post-' + postId + '" data-postid="' + postId + '" class="notice-post-link red-mod-link" title="add post notice">notice</a>';
            }
            postMenu.append(noticeLink);

            // Create add/remove community wiki link
            if (isWiki) {
                wikiLink = '<a id="unwiki-post-' + postId + '" data-postid="' + postId + '" class="unwiki-post-link red-mod-link" title="remove community wiki status">unwiki</a>';
            } else {
                wikiLink = '<a id="wiki-post-' + postId + '" data-postid="' + postId + '" class="wiki-post-link red-mod-link" title="convert to community wiki">wiki</a>';
            }
            postMenu.append(wikiLink);

            // Create mod comment action links
            var commentMenu = $(this).find('[id^=comments-link-]');
            var hasComments = !$(this).find('.comments').hasClass('dno');
            var showLink = $(this).find('.js-show-link');
            var moreComments = showLink.find('b').text();
            showLink.html('<b>' + moreComments + '</b> more comment' + (moreComments > 1 ? 's' : ''));
            if (hasComments) {
                var modLinks = $('<div class="mod-action-links" style="float: right; padding-right: 10px"></div>');
                var separator = '<span>&nbsp;|&nbsp;</span>';
                var moveLink = '<a id="move-comments-' + postId + '" data-postid="' + postId + '" class="move-comments-link comments-link red-mod-link" title="move all comments to chat and purge">move to chat</a>';
                var purgeLink = '<a id="purge-comments-' + postId + '" data-postid="' + postId + '" class="purge-comments-link comments-link red-mod-link" title="delete all comments">purge all</a>';
                modLinks.append(moveLink);
                modLinks.append(separator);
                modLinks.append(purgeLink);
                commentMenu.append(modLinks);
            }

            postMenu.append('<br /><span class="lsep">|</span>');

            // Create timeline and revision history links
            var revisionsLink = '<a href="/posts/' + postId + '/revisions" class="comments-link ">revisions</a>';
            var timelineLink = '<a href="/posts/' + postId + '/timeline" class="comments-link">timeline</a>';
            postMenu.append(revisionsLink);
            postMenu.append(timelineLink);

            // Create remove bounty link
            if (hasBounty) {
                var bountyLink = '<a id="remove-bounty-' + postId + '" data-postid="' + postId + '" class="remove-bounty-link red-mod-link" style="display: inline-block; margin-bottom: 1em" title="refund the bounty amount and remove the bounty notice">remove bounty</a>';
                $('.bounty-notification .question-status.bounty').append(bountyLink);
            }
        });
        $('.unlock-post-link').click(function() {
           if (window.confirm(getActionDescription('unlock', getPostType($(this))) + 'Are you sure you want to complete this action?')) {
               completeBasicAction('unlock', $(this), false);
           }
        });
        $('.wiki-post-link').click(function() {
            if (window.confirm(getActionDescription('wikify', getPostType($(this))) + 'Are you sure you want to complete this action?')) {
                completeBasicAction('wikify', $(this), false);
            }
        });
        $('.unwiki-post-link').click(function() {
            if (window.confirm(getActionDescription('remove-wiki', getPostType($(this))) + 'Are you sure you want to complete this action?')) {
                completeBasicAction('remove-wiki', $(this), false);
            }
        });
        $('.purge-comments-link').click(function() {
            if (window.confirm(getActionDescription('delete-comments', getPostType($(this))) + 'Are you sure you want to complete this action?')) {
                completeBasicAction('delete-comments', $(this), purgeAllComments);
            }
        });
        $('.remove-bounty-link').click(function() {
            if (window.confirm(getActionDescription('remove-bounty', getPostType($(this))) + 'Are you sure you want to complete this action?')) {
                completeBasicAction('remove-bounty', $(this), false);
            }
        });

        window.getPostType = function (e) {
            var parent = e.closest('.question, .answer');
            if (parent.hasClass('question')) {
                return 'question';
            } else {
                return 'answer';
            }
        };

        window.completeBasicAction = function (action, e, callback) {
            var postId = e.data('postid');
            var succeeded;
            $.ajax({
                'type': 'POST',
                'url': '/admin/posts/' + postId + '/' + action,
                'data': {
                    'mod-actions': action,
                    'fkey': StackExchange.options.user.fkey
                }
            }).success(function () {
                if (callback === false) {
                    var parentPost = e.closest('.question, .answer');
                    var currentPath = window.location.pathname.split('/');
                    currentPath = currentPath.slice(0, 4);
                    if (parentPost.hasClass('answer')) {
                        currentPath[4] = postId + '#' + postId;
                    }
                    var newPath = currentPath.join('/');
                    window.location = newPath;
                } else {
                    callback(postId);
                }
            }).error(function () {
                e.closest('.post-menu').showErrorMessage("An error has occurred - please retry your request.");
            });
            return succeeded;
        };

        window.purgeAllComments = function (postId) {
            $('#comments-' + postId).addClass('dno');
            $('#comments-link-' + postId).find('.js-show-link, .js-link-separator, .js-deleted-separator, .fetch-deleted-comments, .mod-action-links').addClass('dno');
        };

        window.checkModMenu = function (postType) {
            if (modMenu[postType] === '') {
                var postId = $('.' + postType).data(postType + 'id');
                $.ajax({
                    'type': 'GET',
                    'async': false,
                    'url': '/admin/posts/' + postId + '/moderator-menu',
                    'data': {
                        'fkey': StackExchange.options.user.fkey
                    },
                    'success': function (data) {
                        modMenu[postType] = $(data);
                    },
                    'error': function () {
                        modMenu[postType] = '';
                        alert('Failed to load moderator menu. Expect things to be broken.');
                    }
                });
            }
            return modMenu[postType];
        };

        window.getActionDescription = function (actionName, postType) {
            var postModMenu = checkModMenu(postType);
            var description = '';
            if (postModMenu !== '') {
                description = postModMenu.find('input[name="mod-actions"][value="' + actionName + '"]').parent().find('.action-desc').text().trim();
            }
            if (description !== '') {
                description = description + '\n\n';
            }
            return description;
        };

        window.getSubOptions = function (actionName, postType) {
            var postModMenu = checkModMenu(postType);
            var suboptions = '';
            if (postModMenu !== '') {
                suboptions = postModMenu.find('input[name="mod-actions"][value="' + actionName + '"]').parent().Parent().find('.action-subform').html();
            }
            return suboptions;
        };
    }
});

$(document).on("DOMNodeInserted", function(e) {
    var elem = $(e.target);
    if (elem.hasClass("post-issue")) {
        var postId = elem.data('postid');
        var showLink = $('#comments-link-' + postId + ' .js-show-link');
        var deletedComments = elem.find('.fetch-deleted-comments').text().trim().split(' ')[0];
        if (deletedComments !== '') {
            var deletedCommentsLink = '<span class="js-deleted-separator">&nbsp;|&nbsp;</span><a class="fetch-deleted-comments comments-link red-mod-link"><b>' + deletedComments + '</b> deleted</a>';
            showLink.after(deletedCommentsLink);
        }

        var numberFlags = elem.find('a:first-child:not(.fetch-deleted-comments)').text().trim().split(' ')[0];
        if (numberFlags !== '') {
            var voteMenu = elem.parent().find('.vote');
            var flagsIndicator = '<a href="/admin/posts/' + postId + '/show-flags" class="bounty-award-container" target="_blank"><span class="bounty-award supernovabg" style="font-size: 1em; margin-top: 10px" title="flags on this post">' + numberFlags + '</span></a>';
            voteMenu.append(flagsIndicator);
        }

        elem.remove();

        $('.fetch-deleted-comments').click(function() {
            var postId = $(this).parent().attr('id').replace('comments-link-', '');
            $.ajax({
                'type': 'GET',
                'url': '/posts/' + postId + '/comments?includeDeleted=true',
                'data': {
                    'fkey': StackExchange.options.user.fkey
                }
            }).success(function (data) {
                $('#comments-' + postId).removeClass('dno');
                $('#comments-' + postId + ' tbody').html(data);
                $('#comments-' + postId + ' .undelete-comment').click(function() {
                    var e = $(this);
                    var comment = e.closest('.comment');
                    var commentId = comment.attr('id').replace('comment-', '');
                    if (e.is(':working') || (e.working(!0).addSpinnerAfter({'padding':'0 3px'}))) {
                        $.ajax({
                            'type': 'POST',
                            'url': '/admin/posts/' + postId + '/comments/' + commentId + '/undelete',
                            'dataType': 'html',
                            'data': {
                                'fkey': StackExchange.options.user.fkey
                            }
                        }).done(function(newComment){
                            comment.replaceWith(newComment);
                        }).fail(function(t, error){
                            e.parent().showErrorMessage(error || "An error occurred while trying to undelete.");
                        }).always(function(){
                            StackExchange.helpers.removeSpinner(), e.working(!1);
                        });
                    }
                });
                $('#comments-link-' + postId).find('.js-show-link, .js-link-separator, .js-deleted-separator, .fetch-deleted-comments').addClass('dno');
            }).error(function () {
                $('#comments-link-' + postId).showErrorMessage("An error has occurred - please retry your request.");
            });
        });
    }
});

var sheet = (function() {
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    return style.sheet;
})();
sheet.insertRule('.post-menu .red-mod-link, .red-mod-link { color: #A44 }', 0);
sheet.insertRule('.post-menu .red-mod-link:hover, .red-mod-link:hover { color: #600 }', 1);
sheet.insertRule('.post-menu .red-mod-disabled { color: #C88; padding: 0 3px 2px 3px }', 1);
