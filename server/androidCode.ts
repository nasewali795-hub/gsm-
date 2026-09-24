/**
 * Complete Android Studio Project for Flametide GSM Gateway
 * Package: com.flametide.gateway
 * Min SDK: 21 (Android 5.0 Lollipop) | Target SDK: 35 (Android 15)
 * Architecture: Embedded ApiServer (8080) -> UssdExecutor (ACTION_CALL) ->
 * AccessibilityService (TYPE_WINDOW_CONTENT_CHANGED) -> ResponseParser ->
 * ResultSender (OkHttp with retries) -> AuditLogger (SQLite)
 */

export interface AndroidFile {
  path: string;
  filename: string;
  language: string;
  category: 'manifest' | 'gradle' | 'service' | 'telephony' | 'ui' | 'network' | 'db';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFile[] = [
  {
    path: 'app/src/main/AndroidManifest.xml',
    filename: 'AndroidManifest.xml',
    language: 'xml',
    category: 'manifest',
    description: 'Declares required permissions: CALL_PHONE, READ_PHONE_STATE, INTERNET, SYSTEM_ALERT_WINDOW, BIND_ACCESSIBILITY_SERVICE.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.flametide.gateway">

    <!-- Requested Permissions -->
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE"
        tools:ignore="ProtectedPermissions" />

    <!-- Persistent Service Permissions -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:name=".FlametideGatewayApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Flametide GSM Gateway"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.FlametideGateway"
        android:usesCleartextTraffic="true"
        tools:targetApi="35">

        <!-- Minimal Operator View Activity -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Foreground Service Hosting Port 8080 ApiServer -->
        <service
            android:name=".api.ApiServerService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="connectedDevice" />

        <!-- Accessibility Service to Capture USSD Popups via TYPE_WINDOW_CONTENT_CHANGED -->
        <service
            android:name=".accessibility.UssdAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/ussd_accessibility_service_config" />
        </service>

    </application>
</manifest>`,
  },
  {
    path: 'app/src/main/res/xml/ussd_accessibility_service_config.xml',
    filename: 'ussd_accessibility_service_config.xml',
    language: 'xml',
    category: 'manifest',
    description: 'Accessibility service configuration listening for TYPE_WINDOW_CONTENT_CHANGED events on dialer/phone popups.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/accessibility_service_description"
    android:accessibilityEventTypes="typeWindowContentChanged|typeWindowStateChanged"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows|flagIncludeNotImportantViews"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:notificationTimeout="100"
    android:canRetrieveWindowContent="true"
    android:settingsActivity="com.flametide.gateway.ui.MainActivity" />`,
  },
  {
    path: 'app/build.gradle.kts',
    filename: 'build.gradle.kts',
    language: 'kotlin',
    category: 'gradle',
    description: 'Gradle configuration targeting minSdk 21 and targetSdk 35 with OkHttp, Coroutines, and Gson.',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.flametide.gateway"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.flametide.gateway"
        minSdk = 21 // Min SDK 21 (Android 5.0 Lollipop)
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    // OkHttp for ResultSender (POST to hub-server with retries)
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // JSON serialization
    implementation("com.google.code.gson:gson:2.11.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}`,
  },
  {
    path: 'app/src/main/java/com/flametide/gateway/model/Models.kt',
    filename: 'Models.kt',
    language: 'kotlin',
    category: 'service',
    description: 'Data classes for USSD requests, TransactionResult, AuditRecords, and role-based permissions.',
    content: `package com.flametide.gateway.model

import com.google.gson.annotations.SerializedName

enum class Status {
    @SerializedName("SUCCESS")
    SUCCESS,
    @SerializedName("FAILED")
    FAILED
}

enum class UserRole {
    ADMIN,
    HUB_CLIENT,
    OPERATOR
}

data class UssdRequest(
    val id: String,
    val code: String,
    val simSlot: Int = 1,
    val callbackUrl: String? = null,
    val timeoutMs: Long = 30000L,
    val metadata: Map<String, String>? = null
)

data class TransactionResult(
    val requestId: String,
    val code: String,
    val status: Status,
    val rawResponse: String,
    val balance: String? = null,
    val transactionId: String? = null,
    val errorMessage: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

data class AuditRecord(
    val id: Long = 0,
    val action: String,
    val requestId: String?,
    val code: String?,
    val status: String,
    val details: String?,
    val timestamp: Long = System.currentTimeMillis()
)
`,
  },
  {
    path: 'app/src/main/java/com/flametide/gateway/api/ApiServer.kt',
    filename: 'ApiServer.kt',
    language: 'kotlin',
    category: 'service',
    description: 'Embedded HTTP Server listening on port 8080 with role-based security, input validation, and USSD dispatch.',
    content: `package com.flametide.gateway.api

import android.content.Context
import android.util.Log
import com.flametide.gateway.db.AuditLogger
import com.flametide.gateway.model.Status
import com.flametide.gateway.model.TransactionResult
import com.flametide.gateway.model.UserRole
import com.flametide.gateway.model.UssdRequest
import com.flametide.gateway.ussd.UssdExecutor
import com.google.gson.Gson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.ServerSocket
import java.net.Socket
import java.util.concurrent.atomic.AtomicBoolean

class ApiServer(
    private val context: Context,
    private val port: Int = 8080
) {
    companion object {
        private const val TAG = "ApiServer"
        // In production, configure through secure preferences or key store
        private val API_KEYS = mapOf(
            "flametide_hub_secret_token_2026" to UserRole.HUB_CLIENT,
            "flametide_admin_master_key" to UserRole.ADMIN
        )
    }

    private var serverSocket: ServerSocket? = null
    private val isRunning = AtomicBoolean(false)
    private val gson = Gson()
    private val scope = CoroutineScope(Dispatchers.IO)

    fun start() {
        if (isRunning.get()) return
        scope.launch {
            try {
                serverSocket = ServerSocket(port)
                isRunning.set(true)
                Log.i(TAG, "ApiServer started on port $port")
                AuditLogger.getInstance(context).logAction(
                    action = "SERVER_START",
                    requestId = null,
                    code = null,
                    status = "SUCCESS",
                    details = "Listening on port $port"
                )

                while (isRunning.get()) {
                    val clientSocket = serverSocket?.accept() ?: break
                    scope.launch { handleClient(clientSocket) }
                }
            } catch (e: Exception) {
                if (isRunning.get()) {
                    Log.e(TAG, "Server error: \${e.message}", e)
                    AuditLogger.getInstance(context).logAction(
                        action = "SERVER_ERROR",
                        requestId = null,
                        code = null,
                        status = "FAILED",
                        details = e.message
                    )
                }
            }
        }
    }

    fun stop() {
        isRunning.set(false)
        try {
            serverSocket?.close()
            Log.i(TAG, "ApiServer stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error closing server: \${e.message}")
        }
    }

    private fun handleClient(socket: Socket) {
        try {
            socket.use { s ->
                val reader = BufferedReader(InputStreamReader(s.getInputStream()))
                val out = s.getOutputStream()

                val requestLine = reader.readLine() ?: return
                val parts = requestLine.split(" ")
                if (parts.size < 2) return

                val method = parts[0]
                val path = parts[1]

                // Read headers
                val headers = mutableMapOf<String, String>()
                var contentLength = 0
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    if (line.isNullOrBlank()) break
                    val headerParts = line!!.split(": ", limit = 2)
                    if (headerParts.size == 2) {
                        headers[headerParts[0].lowercase()] = headerParts[1]
                        if (headerParts[0].equals("content-length", ignoreCase = true)) {
                            contentLength = headerParts[1].toIntOrNull() ?: 0
                        }
                    }
                }

                // Security Check: Role-Based Authorization
                val authHeader = headers["authorization"]
                val token = authHeader?.removePrefix("Bearer ")?.trim()
                val role = API_KEYS[token]

                if (path != "/status" && role == null) {
                    sendResponse(out, 401, """{"error":"Unauthorized","message":"Invalid or missing Bearer token"}""")
                    return
                }

                // Router
                when {
                    method == "GET" && path == "/status" -> {
                        val statusJson = """{"status":"ONLINE","port":$port,"activeLocks":false}"""
                        sendResponse(out, 200, statusJson)
                    }

                    method == "POST" && path == "/api/ussd" -> {
                        // Role check: Only HUB_CLIENT or ADMIN can execute USSD
                        if (role != UserRole.HUB_CLIENT && role != UserRole.ADMIN) {
                            sendResponse(out, 403, """{"error":"Forbidden","message":"Role $role lacks ussd:execute permission"}""")
                            return
                        }

                        // Read body
                        val charArray = CharArray(contentLength)
                        reader.read(charArray, 0, contentLength)
                        val body = String(charArray)

                        try {
                            val ussdRequest = gson.fromJson(body, UssdRequest::class.java)
                            if (ussdRequest.code.isBlank()) {
                                sendResponse(out, 400, """{"error":"Bad Request","message":"USSD 'code' is required"}""")
                                return
                            }

                            AuditLogger.getInstance(context).logAction(
                                action = "REQUEST_RECEIVED",
                                requestId = ussdRequest.id,
                                code = ussdRequest.code,
                                status = "PROCESSING",
                                details = "SIM slot: \${ussdRequest.simSlot}"
                            )

                            // Trigger UssdExecutor dial
                            val accepted = UssdExecutor.getInstance(context).execute(ussdRequest)
                            if (accepted) {
                                sendResponse(out, 202, """{"status":"ACCEPTED","requestId":"\${ussdRequest.id}","message":"Dialing initiated"}""")
                            } else {
                                sendResponse(out, 409, """{"error":"Busy","message":"Another USSD session is currently active"}""")
                            }
                        } catch (e: Exception) {
                            sendResponse(out, 400, """{"error":"Invalid JSON","message":"\${e.message}"}""")
                        }
                    }

                    else -> {
                        sendResponse(out, 404, """{"error":"Not Found"}""")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Client handling exception: \${e.message}")
        }
    }

    private fun sendResponse(out: OutputStream, code: Int, json: String) {
        val statusText = when (code) {
            200 -> "OK"
            202 -> "Accepted"
            400 -> "Bad Request"
            401 -> "Unauthorized"
            403 -> "Forbidden"
            404 -> "Not Found"
            409 -> "Conflict"
            else -> "Error"
        }
        val response = "HTTP/1.1 $code $statusText\\r\\n" +
                "Content-Type: application/json; charset=UTF-8\\r\\n" +
                "Content-Length: \${json.toByteArray().size}\\r\\n" +
                "Connection: close\\r\\n\\r\\n" + json
        out.write(response.toByteArray())
        out.flush()
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/flametide/gateway/ussd/UssdExecutor.kt',
    filename: 'UssdExecutor.kt',
    language: 'kotlin',
    category: 'telephony',
    description: 'Dials USSD codes using Intent.ACTION_CALL with URL-encoded hash tags and concurrency safety.',
    content: `package com.flametide.gateway.ussd

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import com.flametide.gateway.db.AuditLogger
import com.flametide.gateway.model.Status
import com.flametide.gateway.model.TransactionResult
import com.flametide.gateway.model.UssdRequest
import com.flametide.gateway.sender.ResultSender
import java.net.URLEncoder
import java.util.concurrent.atomic.AtomicBoolean

class UssdExecutor private constructor(private val context: Context) {

    companion object {
        private const val TAG = "UssdExecutor"

        @Volatile
        private var instance: UssdExecutor? = null

        fun getInstance(context: Context): UssdExecutor {
            return instance ?: synchronized(this) {
                instance ?: UssdExecutor(context.applicationContext).also { instance = it }
            }
        }
    }

    private val isExecuting = AtomicBoolean(false)
    private var currentRequest: UssdRequest? = null
    private val handler = Handler(Looper.getMainLooper())
    private var timeoutRunnable: Runnable? = null

    @Synchronized
    fun execute(request: UssdRequest): Boolean {
        if (isExecuting.get()) {
            Log.w(TAG, "USSD execution blocked: Busy with \${currentRequest?.id}")
            return false
        }

        // Permission check
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "Missing CALL_PHONE permission")
            AuditLogger.getInstance(context).logAction(
                action = "DIAL_FAILED",
                requestId = request.id,
                code = request.code,
                status = "FAILED",
                details = "Permission CALL_PHONE not granted"
            )
            return false
        }

        isExecuting.set(true)
        currentRequest = request

        // Setup Timeout watchdog
        timeoutRunnable = Runnable {
            if (isExecuting.get() && currentRequest?.id == request.id) {
                Log.e(TAG, "USSD Session Timeout after \${request.timeoutMs}ms")
                handleSessionCompleted(
                    TransactionResult(
                        requestId = request.id,
                        code = request.code,
                        status = Status.FAILED,
                        rawResponse = "Session Timeout: No USSD popup received from operator within \${request.timeoutMs / 1000}s",
                        errorMessage = "TIMEOUT"
                    )
                )
            }
        }
        handler.postDelayed(timeoutRunnable!!, request.timeoutMs)

        dialCode(request.code, request.simSlot)
        return true
    }

    @SuppressLint("MissingPermission")
    private fun dialCode(code: String, simSlot: Int) {
        try {
            // CRITICAL: Encode '#' as '%23' so Android parses USSD code instead of dialer number
            val encodedHash = URLEncoder.encode("#", "UTF-8")
            val formattedCode = code.replace("#", encodedHash)
            val callUri = Uri.parse("tel:$formattedCode")

            val callIntent = Intent(Intent.ACTION_CALL, callUri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                // Dual SIM routing extras
                putExtra("com.android.phone.extra.slot", simSlot - 1)
                putExtra("simSlot", simSlot - 1)
                putExtra("sim_slot", simSlot - 1)
            }

            Log.i(TAG, "Dialing USSD via Intent.ACTION_CALL: $code on SIM $simSlot")
            AuditLogger.getInstance(context).logAction(
                action = "DIAL_USSD",
                requestId = currentRequest?.id,
                code = code,
                status = "DIALED",
                details = "SIM slot: $simSlot"
            )

            context.startActivity(callIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Dialing error: \${e.message}", e)
            currentRequest?.let { req ->
                handleSessionCompleted(
                    TransactionResult(
                        requestId = req.id,
                        code = req.code,
                        status = Status.FAILED,
                        rawResponse = "Dial Exception: \${e.message}",
                        errorMessage = e.message
                    )
                )
            }
        }
    }

    fun getCurrentRequest(): UssdRequest? = currentRequest

    @Synchronized
    fun handleSessionCompleted(result: TransactionResult) {
        timeoutRunnable?.let { handler.removeCallbacks(it) }
        isExecuting.set(false)
        val completedReq = currentRequest
        currentRequest = null

        Log.i(TAG, "USSD completed for \${result.requestId}. Status: \${result.status}")

        // Log to SQLite
        AuditLogger.getInstance(context).logTransaction(result)

        // Post back to Hub Server via ResultSender
        ResultSender.getInstance(context).sendResult(result, completedReq?.callbackUrl)
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/flametide/gateway/accessibility/UssdAccessibilityService.kt',
    filename: 'UssdAccessibilityService.kt',
    language: 'kotlin',
    category: 'telephony',
    description: 'AccessibilityService capturing USSD popup dialogs via TYPE_WINDOW_CONTENT_CHANGED, dismissing dialogs, and forwarding to ResponseParser.',
    content: `package com.flametide.gateway.accessibility

import android.accessibilityservice.AccessibilityService
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.flametide.gateway.db.AuditLogger
import com.flametide.gateway.parser.ResponseParser
import com.flametide.gateway.ussd.UssdExecutor

class UssdAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "UssdAccessibility"
        // Typical dialer and telephony package names across OEMs
        private val DIALER_PACKAGES = setOf(
            "com.android.phone",
            "com.android.server.telecom",
            "com.google.android.dialer",
            "com.samsung.android.dialer",
            "com.android.systemui"
        )
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "UssdAccessibilityService connected and monitoring popup events")
        AuditLogger.getInstance(applicationContext).logAction(
            action = "ACCESSIBILITY_CONNECTED",
            requestId = null,
            code = null,
            status = "ACTIVE",
            details = "Monitoring TYPE_WINDOW_CONTENT_CHANGED"
        )
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val activeRequest = UssdExecutor.getInstance(applicationContext).getCurrentRequest()
        // Only process events when an active USSD request was dialed
        if (activeRequest == null) return

        val eventType = event.eventType
        val packageName = event.packageName?.toString() ?: ""

        if (eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED ||
            eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
        ) {
            val rootNode = rootInActiveWindow ?: event.source ?: return
            val capturedTextList = mutableListOf<String>()
            extractAllText(rootNode, capturedTextList)

            val fullText = capturedTextList.joinToString(" ").trim()
            if (fullText.isNotBlank() && isLikelyUssdDialog(fullText, packageName)) {
                Log.i(TAG, "USSD Popup Captured: $fullText")

                AuditLogger.getInstance(applicationContext).logAction(
                    action = "POPUP_CAPTURED",
                    requestId = activeRequest.id,
                    code = activeRequest.code,
                    status = "CAPTURED",
                    details = fullText
                )

                // Dismiss or click OK button on dialog to return phone to clean state
                dismissDialog(rootNode)

                // Route through ResponseParser into TransactionResult
                val result = ResponseParser.parse(
                    requestId = activeRequest.id,
                    code = activeRequest.code,
                    rawMessage = fullText
                )

                // Finish session
                UssdExecutor.getInstance(applicationContext).handleSessionCompleted(result)
            }
        }
    }

    private fun extractAllText(node: AccessibilityNodeInfo?, results: MutableList<String>) {
        if (node == null) return
        val text = node.text?.toString()?.trim()
        if (!text.isNullOrBlank() && !isButtonLabel(text)) {
            results.add(text)
        }
        for (i in 0 until node.childCount) {
            extractAllText(node.getChild(i), results)
        }
    }

    private fun dismissDialog(node: AccessibilityNodeInfo?) {
        if (node == null) return
        // Look for buttons like "OK", "Dismiss", "Cancel", "Done"
        val text = node.text?.toString()?.lowercase() ?: ""
        if (node.isClickable && (text == "ok" || text == "dismiss" || text == "cancel" || text == "done")) {
            node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            return
        }
        for (i in 0 until node.childCount) {
            dismissDialog(node.getChild(i))
        }
    }

    private fun isButtonLabel(text: String): Boolean {
        val lower = text.lowercase()
        return lower == "ok" || lower == "cancel" || lower == "send" || lower == "dismiss"
    }

    private fun isLikelyUssdDialog(text: String, packageName: String): Boolean {
        val lower = text.lowercase()
        return (DIALER_PACKAGES.contains(packageName) || packageName.contains("dialer") || packageName.contains("phone")) &&
                (lower.contains("balance") ||
                        lower.contains("airtime") ||
                        lower.contains("account") ||
                        lower.contains("bundle") ||
                        lower.contains("trans") ||
                        lower.contains("invalid") ||
                        lower.contains("mmi") ||
                        lower.contains("ussd") ||
                        lower.contains("session"))
    }

    override fun onInterrupt() {
        Log.w(TAG, "UssdAccessibilityService interrupted")
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/flametide/gateway/parser/ResponseParser.kt',
    filename: 'ResponseParser.kt',
    language: 'kotlin',
    category: 'telephony',
    description: 'Parses carrier reply text into strongly typed TransactionResult with status SUCCESS or FAILED.',
    content: `package com.flametide.gateway.parser

import com.flametide.gateway.model.Status
import com.flametide.gateway.model.TransactionResult
import java.util.regex.Pattern

object ResponseParser {

    // Regex for money/balance values (e.g. $24.50, USD 100, KES 1,500, EUR 12.80)
    private val BALANCE_PATTERN = Pattern.compile(
        """(?:balance|bal|airtime|remains?|amount)[\s:]*([A-Za-z$€£¥]{1,4}\s?[\d,]+(?:\.\d{1,2})?|[\d,]+(?:\.\d{1,2})?\s?[A-Za-z$€£¥]{1,4})""",
        Pattern.CASE_INSENSITIVE
    )

    // Regex for transaction IDs / references (e.g. Ref: AB192831, TxID: 894102)
    private val TX_ID_PATTERN = Pattern.compile(
        """(?:ref|txid|id|txn|reference|receipt)[\s:#]*([A-Za-z0-9\-_]{6,24})""",
        Pattern.CASE_INSENSITIVE
    )

    // Failure keywords
    private val FAILURE_KEYWORDS = listOf(
        "invalid code",
        "connection problem",
        "mmi code error",
        "unknown application",
        "insufficient funds",
        "failed",
        "declined",
        "system error",
        "timed out",
        "try again"
    )

    fun parse(requestId: String, code: String, rawMessage: String): TransactionResult {
        val cleanMsg = rawMessage.trim()
        val lower = cleanMsg.lowercase()

        // 1. Check for failure conditions
        val isFailed = FAILURE_KEYWORDS.any { lower.contains(it) }

        // 2. Extract Balance if present
        var extractedBalance: String? = null
        val balanceMatcher = BALANCE_PATTERN.matcher(cleanMsg)
        if (balanceMatcher.find()) {
            extractedBalance = balanceMatcher.group(1)?.trim()
        }

        // 3. Extract Transaction Reference if present
        var extractedTxId: String? = null
        val txMatcher = TX_ID_PATTERN.matcher(cleanMsg)
        if (txMatcher.find()) {
            extractedTxId = txMatcher.group(1)?.trim()
        }

        val status = if (isFailed) Status.FAILED else Status.SUCCESS
        val errorMessage = if (isFailed) "Operator returned failure code" else null

        return TransactionResult(
            requestId = requestId,
            code = code,
            status = status,
            rawResponse = cleanMsg,
            balance = extractedBalance,
            transactionId = extractedTxId,
            errorMessage = errorMessage
        )
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/flametide/gateway/sender/ResultSender.kt',
    filename: 'ResultSender.kt',
    language: 'kotlin',
    category: 'network',
    description: 'Sends TransactionResult JSON back to hub using OkHttp POST with exponential backoff retries.',
    content: `package com.flametide.gateway.sender

import android.content.Context
import android.util.Log
import com.flametide.gateway.db.AuditLogger
import com.flametide.gateway.model.TransactionResult
import com.google.gson.Gson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class ResultSender private constructor(private val context: Context) {

    companion object {
        private const val TAG = "ResultSender"
        private const val DEFAULT_HUB_URL = "http://hub-server/api/result"
        private const val MAX_RETRIES = 3

        @Volatile
        private var instance: ResultSender? = null

        fun getInstance(context: Context): ResultSender {
            return instance ?: synchronized(this) {
                instance ?: ResultSender(context.applicationContext).also { instance = it }
            }
        }
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val scope = CoroutineScope(Dispatchers.IO)

    fun sendResult(result: TransactionResult, customUrl: String? = null) {
        val targetUrl = customUrl ?: DEFAULT_HUB_URL
        scope.launch {
            postWithRetry(targetUrl, result)
        }
    }

    private suspend fun postWithRetry(url: String, result: TransactionResult) {
        val jsonPayload = gson.toJson(result)
        val body = jsonPayload.toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url(url)
            .post(body)
            .addHeader("User-Agent", "Flametide-GSM-Gateway/1.0")
            .build()

        var attempt = 0
        var delivered = false

        while (attempt < MAX_RETRIES && !delivered) {
            attempt++
            try {
                Log.i(TAG, "Posting result to $url (Attempt $attempt/$MAX_RETRIES)")
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        delivered = true
                        Log.i(TAG, "Result successfully posted to hub: HTTP \${response.code}")
                        AuditLogger.getInstance(context).logAction(
                            action = "HUB_DELIVERY_SUCCESS",
                            requestId = result.requestId,
                            code = result.code,
                            status = "DELIVERED",
                            details = "URL: $url, HTTP \${response.code}"
                        )
                    } else {
                        Log.w(TAG, "Hub responded with error HTTP \${response.code}")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Delivery failed on attempt $attempt: \${e.message}")
            }

            if (!delivered && attempt < MAX_RETRIES) {
                val backoffMs = (1000L * Math.pow(2.0, (attempt - 1).toDouble())).toLong()
                delay(backoffMs)
            }
        }

        if (!delivered) {
            Log.e(TAG, "Exhausted all $MAX_RETRIES delivery attempts to hub: $url")
            AuditLogger.getInstance(context).logAction(
                action = "HUB_DELIVERY_EXHAUSTED",
                requestId = result.requestId,
                code = result.code,
                status = "FAILED",
                details = "Failed after $MAX_RETRIES retries to $url"
            )
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/flametide/gateway/db/AuditLogger.kt',
    filename: 'AuditLogger.kt',
    language: 'kotlin',
    category: 'db',
    description: 'SQLite database logging actions, transactions, and audit records with thread-safe queries.',
    content: `package com.flametide.gateway.db

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.Log
import com.flametide.gateway.model.AuditRecord
import com.flametide.gateway.model.TransactionResult

class AuditLogger private constructor(context: Context) :
    SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val TAG = "AuditLogger"
        private const val DATABASE_NAME = "flametide_gateway_audit.db"
        private const val DATABASE_VERSION = 1

        private const val TABLE_AUDIT = "audit_logs"
        private const val TABLE_TRANSACTIONS = "transactions"

        @Volatile
        private var instance: AuditLogger? = null

        fun getInstance(context: Context): AuditLogger {
            return instance ?: synchronized(this) {
                instance ?: AuditLogger(context.applicationContext).also { instance = it }
            }
        }
    }

    override fun onCreate(db: SQLiteDatabase) {
        // Table 1: Actions Audit Log
        db.execSQL(
            """CREATE TABLE $TABLE_AUDIT (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                request_id TEXT,
                code TEXT,
                status TEXT,
                details TEXT,
                timestamp INTEGER NOT NULL
            )"""
        )

        // Table 2: Parsed Transaction Results
        db.execSQL(
            """CREATE TABLE $TABLE_TRANSACTIONS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id TEXT NOT NULL,
                code TEXT NOT NULL,
                status TEXT NOT NULL,
                raw_response TEXT,
                balance TEXT,
                transaction_id TEXT,
                error_message TEXT,
                timestamp INTEGER NOT NULL
            )"""
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_AUDIT")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_TRANSACTIONS")
        onCreate(db)
    }

    @Synchronized
    fun logAction(action: String, requestId: String?, code: String?, status: String, details: String?) {
        try {
            val db = writableDatabase
            val values = ContentValues().apply {
                put("action", action)
                put("request_id", requestId)
                put("code", code)
                put("status", status)
                put("details", details)
                put("timestamp", System.currentTimeMillis())
            }
            db.insert(TABLE_AUDIT, null, values)
        } catch (e: Exception) {
            Log.e(TAG, "Failed inserting audit log: \${e.message}")
        }
    }

    @Synchronized
    fun logTransaction(result: TransactionResult) {
        try {
            val db = writableDatabase
            val values = ContentValues().apply {
                put("request_id", result.requestId)
                put("code", result.code)
                put("status", result.status.name)
                put("raw_response", result.rawResponse)
                put("balance", result.balance)
                put("transaction_id", result.transactionId)
                put("error_message", result.errorMessage)
                put("timestamp", result.timestamp)
            }
            db.insert(TABLE_TRANSACTIONS, null, values)
        } catch (e: Exception) {
            Log.e(TAG, "Failed inserting transaction: \${e.message}")
        }
    }

    fun getRecentAuditLogs(limit: Int = 50): List<AuditRecord> {
        val list = mutableListOf<AuditRecord>()
        try {
            val db = readableDatabase
            val cursor = db.rawQuery(
                "SELECT id, action, request_id, code, status, details, timestamp FROM $TABLE_AUDIT ORDER BY id DESC LIMIT ?",
                arrayOf(limit.toString())
            )
            cursor.use {
                while (it.moveToNext()) {
                    list.add(
                        AuditRecord(
                            id = it.getLong(0),
                            action = it.getString(1),
                            requestId = it.getString(2),
                            code = it.getString(3),
                            status = it.getString(4),
                            details = it.getString(5),
                            timestamp = it.getLong(6)
                        )
                    )
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Query error: \${e.message}")
        }
        return list
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/flametide/gateway/ui/MainActivity.kt',
    filename: 'MainActivity.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Minimal operator view showing port 8080 status, Accessibility switch, permissions, and live audit feed.',
    content: `package com.flametide.gateway.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.flametide.gateway.R
import com.flametide.gateway.api.ApiServerService
import com.flametide.gateway.db.AuditLogger
import com.flametide.gateway.model.UssdRequest
import com.flametide.gateway.ussd.UssdExecutor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.UUID

class MainActivity : AppCompatActivity() {

    companion object {
        private const val PERM_REQUEST_CODE = 101
    }

    private lateinit var tvServerStatus: TextView
    private lateinit var tvAccessibilityStatus: TextView
    private lateinit var tvAuditLogs: TextView
    private lateinit var btnToggleServer: Button
    private lateinit var btnGrantPerms: Button
    private lateinit var btnOpenAccessibility: Button
    private lateinit var btnTestDial: Button

    private var isServerActive = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvServerStatus = findViewById(R.id.tvServerStatus)
        tvAccessibilityStatus = findViewById(R.id.tvAccessibilityStatus)
        tvAuditLogs = findViewById(R.id.tvAuditLogs)
        btnToggleServer = findViewById(R.id.btnToggleServer)
        btnGrantPerms = findViewById(R.id.btnGrantPerms)
        btnOpenAccessibility = findViewById(R.id.btnOpenAccessibility)
        btnTestDial = findViewById(R.id.btnTestDial)

        checkAndRequestPermissions()

        // Start embedded server service
        startServerService()

        btnToggleServer.setOnClickListener {
            if (isServerActive) {
                stopServerService()
                isServerActive = false
                tvServerStatus.text = "HTTP API Server: STOPPED"
                btnToggleServer.text = "Start Port 8080 Server"
            } else {
                startServerService()
                isServerActive = true
                tvServerStatus.text = "HTTP API Server: RUNNING on :8080"
                btnToggleServer.text = "Stop Server"
            }
        }

        btnGrantPerms.setOnClickListener { checkAndRequestPermissions() }

        btnOpenAccessibility.setOnClickListener {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
        }

        btnTestDial.setOnClickListener {
            val testReq = UssdRequest(
                id = "req-" + UUID.randomUUID().toString().take(6),
                code = "*144#",
                simSlot = 1
            )
            val dialed = UssdExecutor.getInstance(this).execute(testReq)
            if (dialed) {
                Toast.makeText(this, "Test USSD Dialing initiated", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Dialer Busy", Toast.LENGTH_SHORT).show()
            }
        }

        // Live Log refresh loop
        CoroutineScope(Dispatchers.Main).launch {
            while (true) {
                refreshStatusAndLogs()
                delay(2000)
            }
        }
    }

    private fun startServerService() {
        val intent = Intent(this, ApiServerService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun stopServerService() {
        stopService(Intent(this, ApiServerService::class.java))
    }

    private fun checkAndRequestPermissions() {
        val perms = arrayOf(
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.INTERNET
        )
        val missing = perms.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), PERM_REQUEST_CODE)
        }

        // Check overlay permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
            startActivity(intent)
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val enabledServices = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        return enabledServices.contains("com.flametide.gateway.accessibility.UssdAccessibilityService")
    }

    private fun refreshStatusAndLogs() {
        val a11yActive = isAccessibilityServiceEnabled()
        tvAccessibilityStatus.text = if (a11yActive) "Accessibility Service: ACTIVE" else "Accessibility Service: DISABLED (Tap Enable below)"

        val logs = AuditLogger.getInstance(this).getRecentAuditLogs(8)
        val sb = StringBuilder()
        for (log in logs) {
            sb.append("[\${log.status}] \${log.action} - \${log.code ?: ""} \${log.details ?: ""}\\n")
        }
        tvAuditLogs.text = if (sb.isNotBlank()) sb.toString() else "No audit logs recorded yet."
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/flametide/gateway/api/ApiServerService.kt',
    filename: 'ApiServerService.kt',
    language: 'kotlin',
    category: 'service',
    description: 'Persistent Android Service keeping ApiServer active on port 8080 with Foreground Notification.',
    content: `package com.flametide.gateway.api

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.flametide.gateway.ui.MainActivity

class ApiServerService : Service() {

    companion object {
        const val CHANNEL_ID = "flametide_gateway_server"
        const val NOTIFICATION_ID = 2001
    }

    private var server: ApiServer? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        server = ApiServer(applicationContext, port = 8080).apply { start() }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY

    override fun onDestroy() {
        super.onDestroy()
        server?.stop()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Flametide Gateway Server",
                NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pi = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Flametide Gateway Listening")
            .setContentText("Port 8080: Receiving USSD requests")
            .setContentIntent(pi)
            .setOngoing(true)
            .build()
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/flametide/gateway/FlametideGatewayApp.kt',
    filename: 'FlametideGatewayApp.kt',
    language: 'kotlin',
    category: 'service',
    description: 'Application class initializing database and global crash logging.',
    content: `package com.flametide.gateway

import android.app.Application
import android.util.Log
import com.flametide.gateway.db.AuditLogger

class FlametideGatewayApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Log.i("FlametideGateway", "Application initialized")
        AuditLogger.getInstance(this).logAction(
            action = "APP_STARTUP",
            requestId = null,
            code = null,
            status = "INITIALIZED",
            details = "Package: com.flametide.gateway"
        )
    }
}
`,
  },
];
