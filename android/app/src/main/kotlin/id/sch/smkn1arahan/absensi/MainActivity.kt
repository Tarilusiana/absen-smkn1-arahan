package id.sch.smkn1arahan.absensi

import android.Manifest
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.Button
import android.widget.LinearLayout
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    companion object {
        // ============================================================
        //  KONFIGURASI — UBAH URL INI SESUAI SERVER ANDA
        //  Contoh development : http://192.168.100.21:3000
        //  Contoh production  : https://absen.smkn1arahan.sch.id
        // ============================================================
        private const val BASE_URL = "https://absen.smkn1arahan.sch.id"
        private const val APP_TOKEN = "SMKN1ARAHAN-ABSENSI-2026"
    }

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var offlineView: LinearLayout

    private var geoCallback: GeolocationPermissions.Callback? = null
    private var geoOrigin: String? = null

    // Modern permission request API
    private val locationPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false
        geoCallback?.invoke(geoOrigin, fineGranted || coarseGranted, false)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Switch from splash theme to normal theme
        setTheme(R.style.Theme_Absensi)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        offlineView = findViewById(R.id.offlineView)

        val retryButton: Button = findViewById(R.id.btnRetry)
        retryButton.setOnClickListener { loadApp() }

        setupWebView()
        setupSwipeRefresh()
        requestLocationIfNeeded()
        loadApp()
    }

    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            setGeolocationEnabled(true)
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = false
            setSupportZoom(false)
            useWideViewPort = true
            loadWithOverviewMode = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }

        // Inject app token cookie so proxy.js allows the request
        injectAppCookie()

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false
                showWebView()
            }

            override fun onReceivedError(
                view: WebView?, request: WebResourceRequest?, error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    showOffline()
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?, request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                // Keep navigation within the app domain
                return !url.startsWith(BASE_URL)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            // Forward geolocation permission to Android runtime permission system
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?, callback: GeolocationPermissions.Callback?
            ) {
                geoOrigin = origin
                geoCallback = callback
                if (hasLocationPermission()) {
                    callback?.invoke(origin, true, false)
                } else {
                    locationPermissionRequest.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }
            }
        }
    }

    private fun setupSwipeRefresh() {
        swipeRefresh.setColorSchemeColors(
            ContextCompat.getColor(this, R.color.primary)
        )
        swipeRefresh.setOnRefreshListener { webView.reload() }
    }

    private fun injectAppCookie() {
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setCookie(BASE_URL, "app_token=$APP_TOKEN; path=/")
        cookieManager.flush()
    }

    private fun loadApp() {
        if (isNetworkAvailable()) {
            showWebView()
            injectAppCookie()
            webView.loadUrl(BASE_URL)
        } else {
            showOffline()
        }
    }

    private fun showWebView() {
        swipeRefresh.visibility = View.VISIBLE
        offlineView.visibility = View.GONE
    }

    private fun showOffline() {
        swipeRefresh.visibility = View.GONE
        offlineView.visibility = View.VISIBLE
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val cap = cm.getNetworkCapabilities(network) ?: return false
        return cap.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun requestLocationIfNeeded() {
        if (!hasLocationPermission()) {
            locationPermissionRequest.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }
}
