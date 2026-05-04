package id.sch.smkn1arahan.absensi

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.os.Looper
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
        private const val BASE_URL = "https://abs3.smkn1arahan.my.id"
        private const val APP_TOKEN = "SMKN1ARAHAN-ABSENSI-2026"
    }

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var offlineView: LinearLayout
    private lateinit var fakeGpsView: LinearLayout
    private lateinit var locationManager: LocationManager

    private var isLocationMonitoringActive = false

    private var geoCallback: GeolocationPermissions.Callback? = null
    private var geoOrigin: String? = null

    // Modern permission request API
    private val locationPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false
        geoCallback?.invoke(geoOrigin, fineGranted || coarseGranted, false)
        
        if (fineGranted || coarseGranted) {
            startLocationMonitoring()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setTheme(R.style.Theme_Absensi)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        offlineView = findViewById(R.id.offlineView)
        fakeGpsView = findViewById(R.id.fakeGpsView)
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager

        val retryButton: Button = findViewById(R.id.btnRetry)
        retryButton.setOnClickListener { loadApp() }

        val retryFakeGpsButton: Button = findViewById(R.id.btnRetryFakeGps)
        retryFakeGpsButton.setOnClickListener { checkLocationSecurity() }

        setupWebView()
        setupSwipeRefresh()
        requestLocationIfNeeded()
        loadApp()
    }

    override fun onResume() {
        super.onResume()
        if (hasLocationPermission()) {
            startLocationMonitoring()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        locationManager.removeUpdates(locationListener)
    }

    private fun startLocationMonitoring() {
        if (!hasLocationPermission()) return
        if (isLocationMonitoringActive) return

        try {
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                2000L,
                0f,
                locationListener,
                Looper.getMainLooper()
            )
            locationManager.requestLocationUpdates(
                LocationManager.NETWORK_PROVIDER,
                2000L,
                0f,
                locationListener,
                Looper.getMainLooper()
            )
            isLocationMonitoringActive = true
            
            // Check last known immediately
            val lastLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            if (lastLocation != null) {
                checkIfMockLocation(lastLocation)
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    private val locationListener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            checkIfMockLocation(location)
        }
        
        override fun onProviderEnabled(provider: String) {}
        override fun onProviderDisabled(provider: String) {}
    }

    private fun checkIfMockLocation(location: Location) {
        @Suppress("DEPRECATION")
        val isFake = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            location.isMock
        } else {
            location.isFromMockProvider
        }

        if (isFake) {
            showFakeGpsView()
        } else {
            if (fakeGpsView.visibility == View.VISIBLE) {
                hideFakeGpsView()
                loadApp()
            }
        }
    }

    private fun checkLocationSecurity() {
        if (!hasLocationPermission()) {
            requestLocationIfNeeded()
            return
        }
        try {
            val lastLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            if (lastLocation != null) {
                checkIfMockLocation(lastLocation)
                if (fakeGpsView.visibility != View.VISIBLE) {
                    loadApp()
                }
            } else {
                hideFakeGpsView()
                loadApp()
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    private fun showFakeGpsView() {
        swipeRefresh.visibility = View.GONE
        offlineView.visibility = View.GONE
        fakeGpsView.visibility = View.VISIBLE
        webView.loadUrl("about:blank") // Stop webview loading
    }

    private fun hideFakeGpsView() {
        fakeGpsView.visibility = View.GONE
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
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }

        injectAppCookie()

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false
                if (fakeGpsView.visibility != View.VISIBLE) {
                    showWebView()
                }
            }

            override fun onReceivedError(
                view: WebView?, request: WebResourceRequest?, error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true && fakeGpsView.visibility != View.VISIBLE) {
                    showOffline()
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?, request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url == "about:blank") return false
                
                val host = request.url.host ?: ""
                val baseHost = android.net.Uri.parse(BASE_URL).host ?: ""
                return !host.contains(baseHost)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
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
        if (fakeGpsView.visibility == View.VISIBLE) return
        
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
        fakeGpsView.visibility = View.GONE
    }

    private fun showOffline() {
        swipeRefresh.visibility = View.GONE
        offlineView.visibility = View.VISIBLE
        fakeGpsView.visibility = View.GONE
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
        if (webView.canGoBack() && webView.url != "about:blank") {
            webView.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }
}
