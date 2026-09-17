package com.example.msaldemo;

import java.net.URI;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/bff")
public class BffController {

    @GetMapping("/user")
    public Map<String, Object> user(
        @AuthenticationPrincipal OAuth2User oauth2User,
        @RegisteredOAuth2AuthorizedClient("azure") OAuth2AuthorizedClient authorizedClient
    ) {
        if (oauth2User == null || authorizedClient == null) {
            return Map.of("authenticated", false);
        }

        boolean hasToken = authorizedClient.getAccessToken() != null;
        return Map.of(
            "authenticated", true,
            "principal", oauth2User.getName(),
            "accessTokenPresent", hasToken
        );
    }

    @GetMapping("/graph/me")
    public ResponseEntity<String> graphMe(
        @RegisteredOAuth2AuthorizedClient("azure") OAuth2AuthorizedClient authorizedClient
    ) {
        if (authorizedClient == null || authorizedClient.getAccessToken() == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        String token = authorizedClient.getAccessToken().getTokenValue();
        RestTemplate rest = new RestTemplate();
        RequestEntity<Void> request = RequestEntity
            .get(URI.create("https://graph.microsoft.com/v1.0/me"))
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .accept(MediaType.APPLICATION_JSON)
            .build();

        return rest.exchange(request, String.class);
    }
}
