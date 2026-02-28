package com.majorproject.motomate.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import java.io.IOException;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class MultiFormatLocalTimeDeserializer extends StdDeserializer<LocalTime> {

    private static final DateTimeFormatter[] FORMATTERS = new DateTimeFormatter[]{
            DateTimeFormatter.ofPattern("HH:mm:ss"),
            DateTimeFormatter.ofPattern("HH:mm"),
            DateTimeFormatter.ofPattern("h:mm a")
    };

    public MultiFormatLocalTimeDeserializer() {
        super(LocalTime.class);
    }

    @Override
    public LocalTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String text = p.getText().trim();
        for (DateTimeFormatter fmt : FORMATTERS) {
            try {
                return LocalTime.parse(text, fmt);
            } catch (DateTimeParseException e) {
                // try next
            }
        }
        throw new JsonParseException(p, "Cannot parse LocalTime: " + text);
    }
}
