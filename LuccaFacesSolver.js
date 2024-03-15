(async (config) => {
    // VARIABLES //
    let foundNames = new Set();
    let imgId2Names = {};

    // FUNCTIONS //
    function addCssRule(selector, rules) {
        // Check if there are any stylesheets, if not, create one
        if (document.styleSheets.length === 0) {
            var style = document.createElement('style');
            document.head.appendChild(style);
        }
        
        // Get the first stylesheet
        var sheet = document.styleSheets[0];
    
        try {
            if ("insertRule" in sheet) {
                sheet.insertRule(selector + "{" + rules + "}", sheet.cssRules.length);
            } else if ("addRule" in sheet) {
                sheet.addRule(selector, rules, -1);
            }
        } catch (e) {
            console.error("Error adding CSS rule:", e);
        }
    }

    function censuringNames() {
        console.info("⛔ Censuring Names")
        const buttons = document.querySelectorAll('.answer.button');
        buttons.forEach(button => {
            const words = button.innerText.split(' ');
            if (words.length > 1) {
                const newText = words.map(
                    (word, index) => {
                        return (index === 0) ? word : word[0] + '.'
                    }
                ).join(' ');
                button.innerText = newText;
            }
        })
    }

    function sleep(duration) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, duration);
        });
    };

    async function answer() {

        console.group("💡 Answer Event")
        var img = document.querySelector('#game app-timer .image');
        // Get the image id, style and the url from it

        let style = img.currentStyle || window.getComputedStyle(img, false),
        url = style.backgroundImage.slice(4, -1).replace(/"/g, "");

        // To Speed Up
        if (config.speedup) {
            img.style.visibility = "hidden";
            img.style.backgroundImage = "";
        }

        let result = await fetch(url);
        let blob = await result.blob();
        let id = [blob.type, blob.size].toString();



        let possibleAnswerElements = [
            ...document.querySelectorAll('#game .answers .answer')
        ];
        while (!possibleAnswerElements.length) {
            await sleep(10);
            possibleAnswerElements = [
                ...document.querySelectorAll('#game .answers .answer')
            ];
        }

        if (config.censuring_names) {
            censuringNames();
        };
        
        possibleAnswerElements = [
            ...document.querySelectorAll('#game .answers .answer')
        ];

        let known = imgId2Names[id] ?? false;
        let guessed;
        if (known) {
            guessed = known;
            console.info(`🙋‍♂️ Known Person: ${guessed}`)
        } else {
            console.info("🤷‍♂️ Unknown Person !")
            let bestAnswers = possibleAnswerElements.filter(
                e => {
                    return !foundNames.has(e.innerHTML);
                }
            );
            guessed = bestAnswers[
                Math.floor(Math.random() * bestAnswers.length)
            ].innerHTML;
            console.info(`🤔 Guessing: '${guessed}'`)
        }
        
        possibleAnswerElements.filter(
            e => {
                return e.innerHTML == guessed
            }
        )[0].click();

        let rightElement = document.querySelector('#game .answers .is-right');
        while (!rightElement) {
            await sleep(5);
            rightElement = document.querySelector('#game .answers .is-right');
        }
        let rightName = rightElement.innerHTML;
        if (!known) {
            console.info(`🧠 Saving the right answer: '${rightName}'`)
            imgId2Names[id] = rightName;
            foundNames.add(rightName);
        }
        console.groupEnd()
    }

    // MAIN LOOP //
    if (config.censuring_images) {
        // Censuring Profiles
        console.info("⛔ Censuring Images")
        addCssRule(".name-avatar,.player-image,.image", "filter: blur(0.1rem);");
        addCssRule(".image", "filter: blur(7px);");
    }

    while (true) {

        let start_button = document.querySelector('.main-container .rotation-loader');
        while (!start_button) {
            await sleep(100);
            start_button = document.querySelector('.main-container .rotation-loader');
        }

        console.info("🚀 Start button clicked");
        start_button.click();

        let img = document.querySelector('#game app-timer .image');
        while (!img) {
            await sleep(5);
            img = document.querySelector('#game app-timer .image');
        }
        console.group("❔ FaceBook Quizz Page");

        let last_style=null;
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutationRecord) {
                if (img.style.backgroundImage!=last_style) {
                    answer();
                    last_style = img.style.backgroundImage;
                }
            });
        });

        observer.observe(
            img,
            {
                attributes: true,
                attributeFilter: ['style']
            }
        );

        answer();

        let restart_button;
        do {
            await sleep(1000);
            restart_button = document.querySelector('.tryagain');
        } while(!restart_button);
        console.table(
            Object.entries(imgId2Names).map(([image_id, name]) => {
                return { "Name": name, "Image Fingerprint": image_id };
            })
        );
        console.groupEnd()
        console.info("🔄 Restart Button Clicked !");
        document.querySelector('.button.palette-secondary').click();
        await sleep(1000);
    }

})({
    censuring_images: true,
    censuring_names: true,
    speedup: false
})
