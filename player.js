/*!
 *  Howler.js Audio Player Demo
 *  howlerjs.com
 *
 *  (c) 2013-2017, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

// Cache references to DOM elements.
var elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'volumeBtn', 'progress', 'bar', 'wave', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function(playlist) {
  this.playlist = playlist;
  this.index = 0;

  // Display the title of the first track.
  track.innerHTML = '1. ' + playlist[0].title;

  // Setup the playlist display.
  playlist.forEach(function(song) {
    var div = document.createElement('div');
    div.className = 'list-song';
    div.innerHTML = song.title;
    div.onclick = function() {
      player.skipTo(playlist.indexOf(song));
    };
    list.appendChild(div);
  });
};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    var self = this;
    var sound;

    index = typeof index === 'number' ? index : self.index;
    var data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: ['http://arbikthiri.tn/audio/' + data.file + '.mp3', 'http://arbikthiri.tn/audio/' + data.file + '.mp3'],
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function() {
          // Display the duration.
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Start upating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          // Start the wave animation if we have already loaded
          wave.container.style.display = 'block';
          bar.style.display = 'block';
          pauseBtn.style.display = 'block';
        },
        onload: function() {
          // Start the wave animation.
          wave.container.style.display = 'block';
          bar.style.display = 'block';
          loading.style.display = 'none';
        },
        onend: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
          self.skip('right');
        },
        onpause: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
        },
        onstop: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
        }
      });
    }

    // Begin playing the sound.
    sound.play();

    // Update the track display.
    track.innerHTML = (index + 1) + '. ' + data.title;

    // Show the pause button.
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else {
      loading.style.display = 'block';
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Puase the sound.
    sound.pause();

    // Show the play button.
    playBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    var self = this;

    // Get the next track based on the direction of the track.
    var index = 0;
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    var self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    progress.style.width = '0%';

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    var barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%';

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function() {
    var self = this;
    var display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      playlist.style.display = display;
    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function() {
    var self = this;
    var display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

// Setup our new audio player class and pass it the playlist.
var player = new Player([
  {
    title: ' الفاتحة',
    file: '001',
    howl: null
  },
  {
    title: ' البقرة',
    file: '002',
    howl: null
  },
  {
    title: 'آل عمران',
    file: '003',
    howl: null
  },
  {
    title :' النساء',
    file: '004',
    howl: null
  },
  {
    title :'المائدة',
    file: '005',
    howl: null
  },
  {
    title :'الأنعام',
    file: '006',
    howl: null
  },
  {
    title :'الأعراف',
    file: '007',
    howl: null
  },
  {
    title :'الأنفال',
    file: '008',
    howl: null
  },
  {
    title :'التوبة',
    file: '009',
    howl: null
  },
  {
    title :'يونس',
    file: '010',
    howl: null
  },
  {
    title :'هود',
    file: '011',
    howl: null
  },
  {
    title :'يوسف',
    file: '012',
    howl: null
  },
  {
    title :'الرعد',
    file: '013',
    howl: null
  },
  {
    title :'إبراهيم',
    file: '014',
    howl: null
  },
  {
    title :'الحجر',
    file: '015',
    howl: null
  },
  {
    title :'النحل',
    file: '016',
    howl: null
  },
  {
    title :'الإسراء',
    file: '017',
    howl: null
  },
  {
    title :'الكهف',
    file: '018',
    howl: null
  },
  {
    title :'مريم',
    file: '019',
    howl: null
  },
  {
    title :'طه',
    file: '020',
    howl: null
  },
  {
    title :'الأنبياء',
    file: '021',
    howl: null
  },
  {
    title :'الحج',
    file: '022',
    howl: null
  },
  {
    title :'المؤمنون',
    file: '023',
    howl: null
  },
  {
    title :'النّور',
    file: '024',
    howl: null
  },
  {
    title :'الفرقان',
    file: '025',
    howl: null
  },
  {
    title :'الشعراء',
    file: '026',
    howl: null
  },
  {
    title :'النمل',
    file: '027',
    howl: null
  },
  {
    title :'القصص',
    file: '028',
    howl: null
  },
  {
    title :'العنكبوت',
    file: '029',
    howl: null
  },
  {
    title :'الروم',
    file: '030',
    howl: null
  },
  {
    title :'لقمان',
    file: '031',
    howl: null
  },
  {
    title :'السجدة',
    file: '032',
    howl: null
  },
  {
    title :'الأحزاب',
    file: '033',
    howl: null
  },
  {
    title :'سبأ',
    file: '034',
    howl: null
  },
  {
    title :'فاطر',
    file: '035',
    howl: null
  },
  {
    title :'يس',
    file: '036',
    howl: null
  },
  {
    title :'الصافات',
    file: '037',
    howl: null
  },
  {
    title :'ص',
    file: '038',
    howl: null
  },
  {
    title :'الزمر',
    file: '039',
    howl: null
  },
  {
    title :'غافر',
    file: '040',
    howl: null
  },
  {
    title :'فصلت',
    file: '041',
    howl: null
  },
  {
    title :'الشورى',
    file: '042',
    howl: null
  },
  {
    title :'الزخرف',
    file: '043',
    howl: null
  },
  {
    title :'الدخان',
    file: '044',
    howl: null
  },
  {
    title :'الجاثية',
    file: '045',
    howl: null
  },
  {
    title :'الأحقاف',
    file: '046',
    howl: null
  },
  {
    title :'محمد',
    file: '047',
    howl: null
  },
  {
    title :'الفتح',
    file: '048',
    howl: null
  },
  {
    title :'الحجرات',
    file: '049',
    howl: null
  },
  {
    title :'ق',
    file: '050',
    howl: null
  },
  {
    title :'الذاريات',
    file: '051',
    howl: null
  },
  {
    title :'الطور',
    file: '052',
    howl: null
  },
  {
    title :'النجم',
    file: '053',
    howl: null
  },
  {
    title :'القمر',
    file: '054',
    howl: null
  },
  {
    title :'الرحمان',
    file: '055',
    howl: null
  },
  {
    title :'الواقعة',
    file: '056',
    howl: null
  },
  {
    title :'الحديد',
    file: '057',
    howl: null
  },
  {
    title :'المجادلة',
    file: '058',
    howl: null
  },
  {
    title :'الحشر',
    file: '059',
    howl: null
  },
  {
    title :'الممتحنة',
    file: '060',
    howl: null
  },
  {
    title :'الصف',
    file: '061',
    howl: null
  },
  {
    title :'الجمعة',
    file: '062',
    howl: null
  },
  {
    title :'المنافقون',
    file: '063',
    howl: null
  },
  {
    title :'التغابن',
    file: '064',
    howl: null
  },
  {
    title :'الطلاق',
    file: '065',
    howl: null
  },
  {
    title :'التحريم',
    file: '066',
    howl: null
  },
  {
    title :'الملك',
    file: '067',
    howl: null
  },
  {
    title :'القلم',
    file: '068',
    howl: null
  },
  {
    title :'الحاقة',
    file: '069',
    howl: null
  },
  {
    title :'المعارج',
    file: '070',
    howl: null
  },
  {
    title :'نوح',
    file: '071',
    howl: null
  },
  {
    title :'الجن',
    file: '072',
    howl: null
  },
  {
    title :'المزمل',
    file: '073',
    howl: null
  },
  {
    title :'المدثر',
    file: '074',
    howl: null
  },
  {
    title :'القيامة',
    file: '075',
    howl: null
  },
  {
    title :'الإنسان',
    file: '076',
    howl: null
  },
  {
    title :'المرسلات',
    file: '077',
    howl: null
  },
  {
    title :'النبأ',
    file: '078',
    howl: null
  },
  {
    title :'النازعات',
    file: '079',
    howl: null
  },
  {
    title :'عبس',
    file: '080',
    howl: null
  },
  {
    title :'التكوير',
    file: '081',
    howl: null
  },
{
    title :'الإنفطار',
    file: '082',
    howl: null
  },
  {
    title :'المطففين',
    file: '083',
    howl: null
  },
  {
    title :'الإنشقاق',
    file: '084',
    howl: null
  },
  {
    title :'البروج',
    file: '085',
    howl: null
  },
  {
    title :'الطارق',
    file: '086',
    howl: null
  },
  {
    title :'الأعلى',
    file: '087',
    howl: null
  },
  {
    title :'الغاشية',
    file: '088',
    howl: null
  },
  {
    title :'الفجر',
    file: '089',
    howl: null
  },
  {
    title :'البلد',
    file: '090',
    howl: null
  },
  {
    title :'الشمس',
    file: '091',
    howl: null
  },
  {
    title :'الليل',
    file: '092',
    howl: null
  },
  {
    title :'الضحى',
    file: '093',
    howl: null
  },
  {
    title :'الشرح',
    file: '094',
    howl: null
  },
  {
    title :'التين',
    file: '095',
    howl: null
  },
  {
    title :'العلق',
    file: '096',
    howl: null
  },
  {
    title :'القدر',
    file: '097',
    howl: null
  },
  {
    title :'البينة',
    file: '098',
    howl: null
  },
  {
    title :'الزلزلة',
    file: '099',
    howl: null
  },
  {
    title :'العاديات',
    file: '100',
    howl: null
  },
  {
    title :'القارعة',
    file: '101',
    howl: null
  },
  {
    title :'التكاثر',
    file: '102',
    howl: null
  },
{
    title :'العصر',
    file: '103',
    howl: null
  },
  {
    title :'الهمزة',
    file: '104',
    howl: null
  },
  {
    title :'الفيل',
    file: '105',
    howl: null
  },
  {
    title :'قريش',
    file: '106',
    howl: null
  },
  {
    title :'الماعون',
    file: '107',
    howl: null
  },
  {
    title :'الكوثر',
    file: '108',
    howl: null
  },
  {
    title :'الكافرون',
    file: '109',
    howl: null
  },
  {
    title :'النصر',
    file: '110',
    howl: null
  },
  {
    title :'المسد',
    file: '111',
    howl: null
  },
  {
    title :'الإخلاص',
    file: '112',
    howl: null
  },
  {
    title :'الفلق',
    file: '113',
    howl: null
  },
  {
    title :'الناس',
    file: '114',
    howl: null
  }
]);

// Bind our player controls.
playBtn.addEventListener('click', function() {
  player.play();
  pauseBtn.style.display = 'block';

});
pauseBtn.addEventListener('click', function() {
  player.pause();
});
prevBtn.addEventListener('click', function() {
  player.skip('prev');
  pauseBtn.style.display = 'block';

});
nextBtn.addEventListener('click', function() {
  player.skip('next');
  pauseBtn.style.display = 'block';

});
waveform.addEventListener('click', function(event) {
  player.seek(event.clientX / window.innerWidth);
});
playlistBtn.addEventListener('click', function() {
  player.togglePlaylist();
});
playlist.addEventListener('click', function() {
  player.togglePlaylist();
});
volumeBtn.addEventListener('click', function() {
  player.toggleVolume();
});
volume.addEventListener('click', function() {
  player.toggleVolume();
});

// Setup the event listeners to enable dragging of volume slider.
barEmpty.addEventListener('click', function(event) {
  var per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener('mousedown', function() {
  window.sliderDown = true;
});
sliderBtn.addEventListener('touchstart', function() {
  window.sliderDown = true;
});
volume.addEventListener('mouseup', function() {
  window.sliderDown = false;
});
volume.addEventListener('touchend', function() {
  window.sliderDown = false;
});

var move = function(event) {
  if (window.sliderDown) {
    var x = event.clientX || event.touches[0].clientX;
    var startX = window.innerWidth * 0.05;
    var layerX = x - startX;
    var per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
    player.volume(per);
  }
};

volume.addEventListener('mousemove', move);
volume.addEventListener('touchmove', move);

// Setup the "waveform" animation.
var wave = new SiriWave({
    container: waveform,
    width: window.innerWidth,
    height: window.innerHeight * 0.3,
    cover: true,
    speed: 0.03,
    amplitude: 0.7,
    frequency: 2
});
//wave.start();

// Update the height of the wave animation.
// These are basically some hacks to get SiriWave.js to do what we want.
var resize = function() {
  var height = window.innerHeight * 0.3;
  var width = window.innerWidth;
  wave.height = height;
  wave.height_2 = height / 2;
  wave.MAX = wave.height_2 - 4;
  wave.width = width;
  wave.width_2 = width / 2;
  wave.width_4 = width / 4;
  wave.canvas.height = height;
  wave.canvas.width = width;
  wave.container.style.margin = -(height / 2) + 'px auto';

  // Update the position of the slider.
  var sound = player.playlist[player.index].howl;
  if (sound) {
    var vol = sound.volume();
    var barWidth = (vol * 0.9);
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  }
};
window.addEventListener('resize', resize);
resize();
