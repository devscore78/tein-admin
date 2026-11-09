/* Sign-in screen shown after "Sign out". Demo only: any details sign you back in. */
(function (T) {
  'use strict';
  const I = T.icon;
  T.login = {
    html() {
      return '<div class="login"><section class="card login-card"><a class="wordmark" href="#overview"><b>TEIN</b><small>Admin</small></a>' +
        '<h1>Welcome back</h1><p>Sign in to manage members, dues and the public site.</p>' +
        '<form id="lgform" class="form-stack" novalidate>' +
        '<div class="field"><label class="label" for="lg-email">Email</label><input class="input" id="lg-email" type="email" autocomplete="username" value="main.admin@tein.example"></div>' +
        '<div class="field"><label class="label" for="lg-pass">Password</label><input class="input" id="lg-pass" type="password" autocomplete="current-password" value="demo-password"></div>' +
        '<button class="btn btn-red" type="submit" style="width:100%">Sign in</button></form></section></div>';
    }
  };
})(window.TEIN = window.TEIN || {});
