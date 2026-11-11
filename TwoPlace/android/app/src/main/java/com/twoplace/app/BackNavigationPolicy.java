package com.twoplace.app;

import java.net.URI;

final class BackNavigationPolicy {
    enum Action { IGNORE, EXIT_PROMPT, HOME }

    static Action resolve(String url, String result) {
        if ("\"handled\"".equals(result) || "\"loading\"".equals(result)) return Action.IGNORE;
        if ("\"home\"".equals(result) && isHomeUrl(url)) return Action.EXIT_PROMPT;
        return Action.HOME;
    }

    private static boolean isHomeUrl(String url) {
        if (url == null) return false;
        try {
            URI uri = URI.create(url);
            String path = uri.getPath();
            return "https".equalsIgnoreCase(uri.getScheme()) &&
                "serenlucent.github.io".equalsIgnoreCase(uri.getHost()) &&
                ("/APP/TwoPlace/".equals(path) || "/APP/TwoPlace/index.html".equals(path));
        } catch (IllegalArgumentException error) {
            return false;
        }
    }
}
