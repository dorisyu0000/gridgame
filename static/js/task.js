/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode); 
var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to

// All pages to be loaded
var pages = [  
  "instructions/instruct-1.html",
  "instructions/instruct-2.html",
  "instructions/instruct-ready2.html",
  "instructions/instruct-readytext.html",
  "stage_text.html",
  "stage2.html",
  "stage.html",
  "postquestionnaire.html",
  "finishprolific.html",
  "break.html"  
];  
 
const init = (async () => {
  await psiTurk.preloadPages(pages);
})()


var instructionPages = [ 
  "instructions/instruct-1.html",
  "instructions/instruct-2.html",
  "instructions/instruct-readytext.html",
]; 






var getRandomInt=function(max) { 
  return Math.floor(Math.random() * Math.floor(max));
};



var calculate_sum=function(b,t) {
  var s=0
  for(var i=0;i<b.length;i++) {
    for(var j=0;j<b[i].length;j++) {
      if(b[i][j]==t) {
        s+=1
      }
    }
  } 
  return s 
};

var GridWorldExperiment = function() {     
    console.log('GridWorldExperiment constructor called');
    console.log('DATA:', DATA);
    
    var condition=Math.floor(Math.random() * 10) + 1;  // Random condition from 1-10
    var BREAK_INTERVAL = 10;  // Show break every 10 trials
      
    // Record experiment initialization
    psiTurk.recordTrialData({
        phase: 'experiment.start',
        condition: condition,
        timestamp: Date.now()
    });

    // Load configuration from JSON file
    var config = null;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', `/static/config/v1/${condition}.json`, false);  // Updated path to include /static/
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                config = JSON.parse(xhr.responseText);
            } catch (e) {
                console.error('Error parsing JSON:', e);
                return;
            }
        } else {
            console.error('Error loading config:', xhr.status);
            return;
        }
    };
    xhr.onerror = function() {
        console.error('Network error loading config');
        return;
    };
    xhr.send();

    if (!config) {
        console.error('Failed to load configuration');
        return;
    }

    // Initialize mazes and starts from the JSON data
    var mazes = [];
    var starts = [];
    var imagePairs = [];
    var trialNumbers = [];
    var repeat_index = [];
    var rule = [];

    // Process each trial in the main trials array
    config.trials.main.forEach(trial => {
        mazes.push(trial.grid);
        starts.push(trial.start);
        imagePairs.push(trial.image_pairs);
        trialNumbers.push(trial.trial_number);
        repeat_index.push(trial.repeat_index);
        rule.push(trial.rule);
    });

    // Set up the current trial index
    var currentIndex = 0;
    var num_solves = 0;
    var maze = mazes[currentIndex];
    var threshold_hits = calculate_sum(maze, 1);
    var threshold_solves = maze.length;
    var n = maze.length;
    var num_hits = 1;
    var score = 0;
    var currentTrialScore = 6;  // Initialize current trial score
    var cumScore = 0;
    var FINAL_BOARD_EXP = false;
    var board = init_board(n, starts[currentIndex][0][0], starts[currentIndex][0][1]);
    var init_time = 0;
    var done = false;
    var listening = false;
    var first_response = true;
    // Create image objects
    var image1 = new Image();
    var image2 = new Image();
    
    // Function to update image sources for current trial
    var updateImages = function() {
        var currentPair = imagePairs[currentIndex];
        image1.src = `/static/images/openmoji/${currentPair[0]}.svg`;
        image2.src = `/static/images/openmoji/${currentPair[1]}.svg`;
    };
    
    // Wait for images to load
    var imagesLoaded = false;
    var imagesToLoad = 2;
    
    var resetImageLoadCounter = function() {
        imagesToLoad = 2;
        imagesLoaded = false;
    };
    
    image1.onload = function() {
        imagesToLoad--;
        if (imagesToLoad === 0) {
            imagesLoaded = true;
            draw_board();
        }
    };
    
    image2.onload = function() {
        imagesToLoad--;
        if (imagesToLoad === 0) {
            imagesLoaded = true;
            draw_board();
        }
    };

    // Initialize first pair of images
    updateImages();

    var clear_board = function() {
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.rect(0,0,576,576);
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fill();
        ctx.closePath(); 
        document.getElementById("current").innerHTML=("Current Trial: "+(num_solves+1)+"/120");
        document.getElementById("cumulative").innerHTML=("Points This Trial: "+currentTrialScore+"<br>Total Score: "+score);
    };

    var draw_board = function() {
        if (!imagesLoaded) return;
        
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        
        ctx.beginPath();
        ctx.rect(0, 0, 576, 576);
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fill();
        ctx.closePath();
        
        var sq_size = 576/board.length;
        for(var i = 0; i < board.length; i++) {
            var row = board[i];
            for(var j = 0; j < row.length; j++) {
                ctx.beginPath();
                ctx.lineWidth = "1";
                ctx.strokeStyle = "black";
                ctx.rect(j*sq_size, i*sq_size, sq_size, sq_size);
                
                if(board[i][j] == 0) {
                    ctx.drawImage(image1, j*sq_size, i*sq_size, sq_size, sq_size);
                }
                else if(board[i][j] == -1) {
                    ctx.fillStyle = 'rgb(155, 155, 155)';
                    ctx.fill(); 
                }
                else if(board[i][j] == 1) {
                    ctx.drawImage(image2, j*sq_size, i*sq_size, sq_size, sq_size);
                }
                
                ctx.stroke();
                ctx.closePath();
            }
        }
        
        var currentPair = imagePairs[currentIndex];
        document.getElementById("current").innerHTML = `+1 point: <img src="/static/images/openmoji/${currentPair[1]}.svg" width="30" height="30"> -1 point: <img src="/static/images/openmoji/${currentPair[0]}.svg" width="30" height="30"><br>Trial: ${num_solves}/120 ; Score: ${score}`;
        document.getElementById("cumulative").innerHTML = "";
    };

    var final_board = function() {
        if (!imagesLoaded) return;
        
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        
        ctx.beginPath();
        ctx.rect(0, 0, 576, 576);
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fill();
        ctx.closePath();
        
        var sq_size = 576/maze.length;
        for(var i = 0; i < maze.length; i++) {
            var row = maze[i];
            for(var j = 0; j < row.length; j++) {
                ctx.beginPath();
                ctx.lineWidth = "1";
                ctx.strokeStyle = "black";
                ctx.rect(j*sq_size, i*sq_size, sq_size, sq_size);
                
                if(maze[i][j] == 0) {
                    ctx.drawImage(image1, j*sq_size, i*sq_size, sq_size, sq_size);
                }
                else if(maze[i][j] == -1) {
                    ctx.fillStyle = 'rgb(155, 155, 155)';
                    ctx.fill();
                }
                else if(maze[i][j] == 1) {
                    ctx.drawImage(image2, j*sq_size, i*sq_size, sq_size, sq_size);
                }
                
                ctx.stroke();
                ctx.closePath();
            }
        }
        
        var currentPair = imagePairs[currentIndex];
        if(num_solves+1 > threshold_solves) {
          document.getElementById("current").innerHTML = `+1 point: <img src="/static/images/openmoji/${currentPair[1]}.svg" width="30" height="30"> -1 point: <img src="/static/images/openmoji/${currentPair[0]}.svg" width="30" height="30"><br>Trial: ${num_solves}/120 ; Score: ${score}`;
          document.getElementById("cumulative").innerHTML = `You got them all! Your total score is ${cumScore}`;
      }
      else {
          document.getElementById("cumulative").innerHTML = `You got them all! Your total score is ${cumScore}`;
      }
    };

    var show_break = function() {
        listening = false;
        var completed = num_solves;
        var total = threshold_solves;
        
        // Hide the canvas and current score display
        document.getElementById("myCanvas").style.display = "none";
        document.getElementById("current").style.display = "none";
        document.getElementById("cumulative").style.display = "none";
        
        // Create break content
        var breakContent = `
            <div class="break-page" style="text-align: center; padding: 20px; max-width: 600px; margin: 0 auto; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1>Take a Break</h1>
                <p>You've completed ${completed} out of ${total} trials.</p>
                <p>Take a moment to rest. When you're ready to continue, click the button below.</p>
                <button id="continue-btn" style="padding: 10px 20px; font-size: 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Continue</button>
            </div>
        `;
        
        // Create and append break overlay
        var breakOverlay = document.createElement('div');
        breakOverlay.id = 'break-overlay';
        breakOverlay.innerHTML = breakContent;
        document.body.appendChild(breakOverlay);
        
        // Add click handler for continue button
        document.getElementById('continue-btn').addEventListener('click', function() {
            // Remove the break overlay
            document.body.removeChild(breakOverlay);
            
            // Show the canvas and score display again
            document.getElementById("myCanvas").style.display = "block";
            document.getElementById("current").style.display = "block";
            document.getElementById("cumulative").style.display = "block";
            
            // Continue with next trial
            maze = mazes[currentIndex];
            threshold_hits = calculate_sum(maze, 1); 
            num_hits = 1; 
            listening = true; 
            board = init_board(n, starts[currentIndex][0][0], starts[currentIndex][0][1]);
            
            resetImageLoadCounter();
            updateImages();
            
            clear_board();
            draw_board();
            
            // Re-register the response handler
            $("body").focus().click(response_handler);
        });
    };

    var go_next_game = function() {
        currentIndex += 1;  // Increment to move to next trial
        
        // Record trial initialization
        psiTurk.recordTrialData({
            phase: 'trial start',
            trial_number: currentIndex,
            grid: maze,
            trial_type: rule[currentIndex], 
            repeat_index: repeat_index[currentIndex],
            image_pairs: imagePairs[currentIndex],
            threshold_hits: threshold_hits,
            score: score,
            cumulative_score: cumScore,
            timestamp: Date.now()
        });
        
        // Check if we should end the experiment
        if (num_solves > threshold_solves) {
            finish();  // This will end the game and go to post-questionnaire
            return;
        }
        
        // Check if we should show a break
        if (currentIndex > 0 && currentIndex % BREAK_INTERVAL === 0) {
            show_break();
            return;
        }
        
        maze = mazes[currentIndex];
        threshold_hits = calculate_sum(maze, 1); 
        num_hits = 1; 
        listening = true; 
        board = init_board(n, starts[currentIndex][0][0], starts[currentIndex][0][1]);
        
        resetImageLoadCounter();
        updateImages();
        
        clear_board();
        draw_board();
    };

    var go_final_game = function() {
        // Since we're using JSON configuration, we should just end the experiment
        listening = false;
        final_board();
        finish();  // This will end the game and go to post-questionnaire
    };

    var next = async function() {
        if(num_hits == threshold_hits) {     
            num_solves += 1;

            // Record trial completion
            psiTurk.recordTrialData({
                phase: 'trial.complete',
                trial_number: currentIndex,
                score: score,
                cumulative_score: cumScore,
                time_taken: Date.now() - init_time,
                timestamp: Date.now()
            });
            
            if(num_solves >= threshold_solves) {
                listening = false; 
                final_board();
                await new Promise(r => setTimeout(r, 2000));
                finish();
                return;
            } else {
                listening = false;
                cumScore += score; 
                final_board();
                await new Promise(r => setTimeout(r, 2000));
                score = 0;
                currentTrialScore = 6;
                go_next_game();
            } 
        }
        else { 
            listening = true;
            draw_board(); 
        }
    };

    var response_handler = function(e) {
        if(first_response) {
            init_time = e.timeStamp;
            first_response = false;
            return;
        }
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext("2d");
        if(!listening) {
            return;
        }
        var size = 576.0/n; 
        
        if(e.target.tagName.toLowerCase() != 'canvas') {
            return;
        }
        e.preventDefault();
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        var c = parseInt(mouseX/size);
        var r = parseInt(mouseY/size);

        var reward = 0;
        if(c < 0 || c > n || r < 0 || r > n) {
            return;
        }
        if(board[r][c] == -1) {
            if(maze[r][c] == 1) {
                reward = 1;
                board[r][c] = 1;
                num_hits += 1;
                score = score + 1;
            }
            else {
                reward = -1;
                board[r][c] = 0; 
                score = score - 1;
                currentTrialScore = currentTrialScore - 1;
            }
        }

        // Record click event
        psiTurk.recordTrialData({
            phase: 'trial.click',
            trial_number: currentIndex,
            pos: [r, c],
            reward: reward,
            current_score: score,
            cumulative_score: cumScore,
            time: e.timeStamp - init_time,
            timestamp: Date.now()
        });

        var cond_num = 1;
        if(condition) {
            cond_num = 1;
        }
        else {
            cond_num = 0;
        }
        if (FINAL_BOARD_EXP == false) {
            psiTurk.recordTrialData([trialNumbers[currentIndex], r, c, cond_num, reward, e.timeStamp-init_time]);
        }
        else {
            psiTurk.recordTrialData(["FINAL_BOARD", r, c, cond_num, reward, e.timeStamp-init_time]);
        }
        listening = false;
        next();
    };

    var finish = function() {
        // Calculate bonus
        var bonus = cumScore / 100;
        
        // Record experiment completion with bonus
        psiTurk.recordTrialData({
            phase: 'experiment.complete',
            final_score: cumScore,
            total_trials: num_solves,
            bonus: bonus,
            timestamp: Date.now()
        });

        // Record bonus in questiondata
        psiTurk.recordUnstructuredData('bonus', bonus);
        psiTurk.recordUnstructuredData('cumScore', cumScore);

        // Save all data to psiTurk
        psiTurk.saveData({
            success: function() {
                console.log('Data saved successfully');
                $("body").unbind("click", response_handler);
                currentview = new Questionnaire();
            },
            error: function() {
                console.error('Error saving data');
                // Retry saving
                setTimeout(function() {
                    psiTurk.saveData({
                        success: function() {
                            console.log('Data saved on retry');
                            $("body").unbind("click", response_handler);
                            currentview = new Questionnaire();
                        },
                        error: function() {
                            console.error('Failed to save data after retry');
                            // Still proceed to questionnaire
                            $("body").unbind("click", response_handler);
                            currentview = new Questionnaire();
                        }
                    });
                }, 1000);
            }
        });
    };

    // Load the stage.html snippet into the body of the page
    psiTurk.showPage('stage2.html');

    // Register the response handler
    $("body").focus().click(response_handler); 

    // Start the test
    next();

    // Add this to your GridWorldExperiment constructor
    setInterval(() => {
        try {
            DATA.save();
            console.log('Auto-saved data');
        } catch (error) {
            console.error('Error in auto-save:', error);
        }
    }, 30000); // Save every 30 seconds
};



/****************
* Questionnaire *
****************/

var Questionnaire = function() {

  var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

  record_responses = function() {

    psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});

    $('textarea').each( function(i, val) {
      psiTurk.recordUnstructuredData(this.id, this.value);
    });
    $('select').each( function(i, val) {
      psiTurk.recordUnstructuredData(this.id, this.value);    
    });

  };

  prompt_resubmit = function() {
    document.body.innerHTML = error_message;
    $("#resubmit").click(resubmit);
  };

  resubmit = function() {
    document.body.innerHTML = "<h1>Trying to resubmit...</h1>";
    reprompt = setTimeout(prompt_resubmit, 10000);
    
    psiTurk.saveData({
      success: function() {
          clearInterval(reprompt); 
          psiTurk.showPage('finishprolific.html');
           }, 
      error: prompt_resubmit
    });
  };

  // Load the questionnaire snippet 
  psiTurk.showPage('postquestionnaire.html');
  psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});
  
  $("#next").click(function () {
      record_responses();
      psiTurk.saveData({
            success: function(){
                psiTurk.showPage('finishprolific.html');
            }, 
            error: prompt_resubmit});  
  });   
    
  
};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
/*
 $(window).on('load', async () => { 
  await init;
  psiTurk.doInstructions(
    instructionPages, // a list of pages you want to display in sequence
    function() { currentview = new TextExperiment();   } // what you want to do when you are done with instructions
  );
});  
*/


$(window).on('load', async () => { 
    await init;
    psiTurk.doInstructions(
      instructionPages, // a list of pages you want to display in sequence
      function() { currentview = new GridWorldExperiment(); } // what you want to do when you are done with instructions
    );
});  

window.addEventListener('beforeunload', function() {
    try {
        DATA.save();
    } catch (error) {
        console.error('Error saving before unload:', error);
    }
});

