package com.twoplace.app;

import org.junit.Test;
import static org.junit.Assert.assertEquals;
import static com.twoplace.app.BackNavigationPolicy.Action.*;

public class BackNavigationPolicyTest {
    private final String home = "https://serenlucent.github.io/APP/TwoPlace/";

    @Test public void homeNeedsAnExplicitWebHomeResponse() {
        assertEquals(EXIT_PROMPT, BackNavigationPolicy.resolve(home, "\"home\""));
        assertEquals(EXIT_PROMPT, BackNavigationPolicy.resolve(home + "index.html?x=1", "\"home\""));
        assertEquals(IGNORE, BackNavigationPolicy.resolve(home, "\"handled\""));
        assertEquals(HOME, BackNavigationPolicy.resolve(home, "\"fallback\""));
        assertEquals(HOME, BackNavigationPolicy.resolve(home, "null"));
    }

    @Test public void aGameCanNeverOfferExitEvenWithAStaleHomeResponse() {
        String game = home + "adventure.html?mode=defense";
        assertEquals(IGNORE, BackNavigationPolicy.resolve(game, "\"handled\""));
        assertEquals(HOME, BackNavigationPolicy.resolve(game, "\"fallback\""));
        assertEquals(HOME, BackNavigationPolicy.resolve(game, "\"home\""));
        assertEquals(IGNORE, BackNavigationPolicy.resolve(game, "\"loading\""));
    }

    @Test public void externalOfflineAndMalformedPagesReturnHome() {
        for (String url : new String[]{null, "not a url", "https://localhost/offline.html", "https://example.com/APP/TwoPlace/", "https://serenlucent.github.io/APP/TwoPlace/adventure-menu.html", "http://serenlucent.github.io/APP/TwoPlace/"}) {
            assertEquals(HOME, BackNavigationPolicy.resolve(url, "\"home\""));
        }
    }
}
