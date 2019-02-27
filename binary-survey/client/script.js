const ENDPOINT = 'https://w9w2saweg3.execute-api.us-west-2.amazonaws.com/prod'

$( document ).ready(function() {
  $.ajax({
    url: ENDPOINT + '/questions',
    type: 'GET',
    success: function (data) {
      const QUESTIONS = data;

      let shortcutIndex = -1;
      let results = {};

      function loadVote() {
        let vote;

        // Handle and reset malformed vote
        try {
          vote = JSON.parse(localStorage.getItem('vote'));
        } catch {
          vote = null;
        }

        // Set _id if unassigned
        if (!vote || !vote['_id']) {
          vote = {};
          vote['_id'] = 'user' + Math.floor(Math.random() * 2**32);
        }

        return vote;
      }

      function saveVote(vote) {
        // Save to local storage
        localStorage.setItem('vote', JSON.stringify(vote));

        // Save to Rockset
        $.ajax({
          url: ENDPOINT + '/vote',
          type: 'POST',
          data: JSON.stringify(vote)
        });
      }

      function loadQuestions() {    
        let vote = loadVote();
        saveVote(vote);

        // Populate questions
        for (var i = 0; i < QUESTIONS.length; i++) {
          $('#body').append(' \
            <div id="q' + i + '" class="question"> \
              <div id="q' + i + '-left" class="option option-left">' + QUESTIONS[i][0] + '<div class="option-stats"></div></div> \
              <div class="spacer"></div> \
              <div class="prompt"> \
                <div>⟵ (press h)</div> \
                <div class="centered">vote to see results</div> \
                <div>(press l) ⟶</div> \
              </div> \
              <div class="results"> \
                <div class="bar left"><div class="stats"></div></div> \
                <div class="bar right"><div class="stats"></div></div> \
              </div> \
              <div id="q' + i + '-right" class="option option-right">' + QUESTIONS[i][1] + '<div class="option-stats"></div></div> \
            </div> \
          ');

          $('#q' + i + '-left').click(handleClickFalse(i));
          $('#q' + i + '-right').click(handleClickTrue(i));
        }

        refreshResults();
        rerender();

        // Listen for keyboard shortcuts
        $(document).keypress((e) => {
          if (e.which === 104 || e.which === 97) { // pressed 'h' or 'a'
            if (shortcutIndex >= 0) { applyVote(shortcutIndex, false) }
          } else if (e.which === 108 || e.which === 98) { // pressed 'l' or 'b'
            if (shortcutIndex >= 0) { applyVote(shortcutIndex, true) }
          }
        });
      }

      function applyVote(index, value) {
        // Set vote value
        let vote = loadVote();
        vote[QUESTIONS[index][2]] = value;
        saveVote(vote);

        setTimeout(refreshResults, 1000);
        setTimeout(refreshResults, 2000);
        rerender();
      }

      function refreshResults() {
        $.ajax({
          url: ENDPOINT + '/results',
          type: 'GET',
          success: function (data) {
            results = data[0];
            $('#count').html(results['total']);
            for (var i = 0; i < QUESTIONS.length; i++) {
              let left_count = results['q' + i][1] - results['q' + i][0];
              let right_count = results['q' + i][0];
              let left_pct = (left_count / (left_count + right_count) * 100).toFixed(2) + '%';
              let right_pct = (right_count / (left_count + right_count) * 100).toFixed(2) + '%';
              $('#q' + i + ' .left').width(left_pct);
              $('#q' + i + ' .right').width(right_pct);
              $('#q' + i + ' .left .stats').html('<b>' + left_pct + '</b> (' + left_count + ')');
              $('#q' + i + ' .right .stats').html('(' + right_count + ') <b>' + right_pct + '</b>');
              $('#q' + i + ' .option-left .option-stats').html('(' + left_pct + ')');
              $('#q' + i + ' .option-right .option-stats').html('(' + right_pct + ')');
            }
          }
        });
      }

      function handleClickFalse(index) {
        return () => { applyVote(index, false) };
      }

      function handleClickTrue(index) {
        return () => { applyVote(index, true) };
      }

      function rerender() {
        let vote = loadVote();
        let openedPrompts = false;
        let completed = true;

        for (var i = 0; i < QUESTIONS.length; i++) {
          if (vote[QUESTIONS[i][2]] === false || vote[QUESTIONS[i][2]] === true) {
            $('#q' + i).removeClass('show-prompt');
            $('#q' + i).removeClass('show-spacer');
            $('#q' + i).addClass('show-results');

            if (vote[QUESTIONS[i][2]] === false) {
              $('#q' + i).removeClass('vote-right');
              $('#q' + i).addClass('vote-left');
            } else if(vote[QUESTIONS[i][2]] === true) {
              $('#q' + i).removeClass('vote-left');
              $('#q' + i).addClass('vote-right');
            }
          } else {
            completed = false;
            $('#q' + i).removeClass('show-prompt');
            $('#q' + i).removeClass('show-results');
            $('#q' + i).addClass('show-spacer');

            if (openedPrompts === false) {
              $('#q' + i).addClass('show-prompt');
              $('#q' + i).removeClass('show-spacer');
              shortcutIndex = i;
              openedPrompts = true;
            }
          }
        }
        if (openedPrompts === false) {
          shortcutIndex = -1;
        }
        if (completed === true) {
          $('#completed').show();
          window.scrollTo(0, document.body.scrollHeight);
        } else {
          $('#completed').hide();
        }
      }

      loadQuestions();
      setInterval(refreshResults, 10000);
    }
  });
});
