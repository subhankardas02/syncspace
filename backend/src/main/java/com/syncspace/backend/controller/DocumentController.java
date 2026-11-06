
package com.syncspace.backend.controller;

import com.syncspace.backend.AppUser;
import com.syncspace.backend.Document;
import com.syncspace.backend.DocumentShare;
import com.syncspace.backend.DocumentShare.Permission;

import com.syncspace.backend.repository.DocumentRepository;
import com.syncspace.backend.repository.DocumentShareRepository;
import com.syncspace.backend.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:5173")
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final DocumentShareRepository documentShareRepository;

    public DocumentController(
            DocumentRepository documentRepository,
            UserRepository userRepository,
            DocumentShareRepository documentShareRepository) {

        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.documentShareRepository = documentShareRepository;
    }

    // Get the currently logged-in user.
    private AppUser getCurrentUser(Authentication authentication) {

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("Authenticated user not found"));
    }

    // Get all documents owned by or shared with the current user.
    @GetMapping
    public List<Document> getAllDocuments(
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        List<Document> documents =
                new ArrayList<>(
                        documentRepository.findByOwnerId(user.getId())
                );

        List<DocumentShare> sharedDocuments =
                documentShareRepository.findByUserId(user.getId());

        for (DocumentShare share : sharedDocuments) {

            Document document = share.getDocument();

            boolean alreadyExists = documents.stream()
                    .anyMatch(existing ->
                            existing.getId().equals(document.getId()));

            if (!alreadyExists) {
                documents.add(document);
            }
        }

        return documents;
    }

    // Get a document if the user owns it or has been given access.
    @GetMapping("/{id}")
    public ResponseEntity<?> getDocumentById(
            @PathVariable Long id,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        var ownedDocument =
                documentRepository.findByIdAndOwnerId(
                        id, user.getId()
                );

        if (ownedDocument.isPresent()) {
            return ResponseEntity.ok(ownedDocument.get());
        }

        var sharedDocument =
                documentShareRepository.findByDocumentIdAndUserId(
                        id, user.getId()
                );

        if (sharedDocument.isPresent()) {
            return ResponseEntity.ok(
                    sharedDocument.get().getDocument()
            );
        }

        return ResponseEntity.notFound().build();
    }

    // Create a new document.
    @PostMapping
    public ResponseEntity<?> createDocument(
            @RequestBody Document document,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        document.setOwner(user);

        Document savedDocument = documentRepository.save(document);

        return ResponseEntity.ok(savedDocument);
    }

    // Update a document.
    // Owners and EDITORS can update it.
    // VIEWERS cannot update it.
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDocument(
            @PathVariable Long id,
            @RequestBody Document updatedDocument,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        var ownedDocument =
                documentRepository.findByIdAndOwnerId(
                        id, user.getId()
                );

        Document document;

        if (ownedDocument.isPresent()) {

            document = ownedDocument.get();

        } else {

            var sharedDocument =
                    documentShareRepository.findByDocumentIdAndUserId(
                            id, user.getId()
                    );

            if (sharedDocument.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            DocumentShare share = sharedDocument.get();

            if (share.getPermission() != Permission.EDITOR) {
                return ResponseEntity.status(403)
                        .body(Map.of(
                                "message",
                                "You do not have permission to edit this document"
                        ));
            }

            document = share.getDocument();
        }

        document.setTitle(updatedDocument.getTitle());
        document.setContent(updatedDocument.getContent());

        Document savedDocument =
                documentRepository.save(document);

        return ResponseEntity.ok(savedDocument);
    }

    // Delete a document.
    // Only the owner can delete it.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            Authentication authentication) {

        AppUser user = getCurrentUser(authentication);

        return documentRepository
                .findByIdAndOwnerId(id, user.getId())
                .map(document -> {

                    // Remove sharing records before deleting the document.
                    List<DocumentShare> shares =
                            documentShareRepository.findByDocumentId(id);

                    documentShareRepository.deleteAll(shares);

                    documentRepository.delete(document);

                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Share a document with another registered user.
    @PostMapping("/{id}/shares")
    public ResponseEntity<?> shareDocument(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        AppUser owner = getCurrentUser(authentication);

        var documentOptional =
                documentRepository.findByIdAndOwnerId(
                        id, owner.getId()
                );

        if (documentOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String email = request.get("email");
        String permissionValue = request.get("permission");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email is required"));
        }

        if (permissionValue == null || permissionValue.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Permission is required"));
        }

        var recipientOptional =
                userRepository.findByEmail(
                        email.trim().toLowerCase()
                );

        if (recipientOptional.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "User does not exist"));
        }

        AppUser recipient = recipientOptional.get();

        if (recipient.getId().equals(owner.getId())) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "You already own this document"
                    ));
        }

        Permission permission;

        try {
            permission = Permission.valueOf(
                    permissionValue.trim().toUpperCase()
            );
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Permission must be EDITOR or VIEWER"
                    ));
        }

        Document document = documentOptional.get();

        var existingShare =
                documentShareRepository.findByDocumentIdAndUserId(
                        id, recipient.getId()
                );

        DocumentShare share = existingShare.orElseGet(
                DocumentShare::new
        );

        share.setDocument(document);
        share.setUser(recipient);
        share.setPermission(permission);

        documentShareRepository.save(share);

        return ResponseEntity.ok(Map.of(
                "message", "Document shared successfully",
                "email", recipient.getEmail(),
                "permission", permission.name()
        ));
    }
}
