package ai.ssot.dashway.neo4jwriter.ingest.application;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import ai.ssot.dashway.neo4jwriter.dashway.application.DashwaySchemaService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import tools.jackson.databind.json.JsonMapper;

class DashwayGraphEventDispatcherTests {

    private final DashwaySchemaService dashwaySchemaService = Mockito.mock(DashwaySchemaService.class);
    private final DashwayGraphEventDispatcher dispatcher = new DashwayGraphEventDispatcher(
        JsonMapper.builder().build(),
        dashwaySchemaService
    );

    @Test
    void dispatchConceptUpsertToDashwaySchemaService() {
        dispatcher.dispatch(
            GraphEventType.CONCEPT_UPSERT,
            Map.of(
                "id",
                "concept-billing-retry",
                "name",
                "Billing Retry",
                "aliases",
                List.of("payment retry")
            )
        );

        verify(dashwaySchemaService).upsertConcept(Mockito.argThat(request ->
            request != null
                && "concept-billing-retry".equals(request.id())
                && "Billing Retry".equals(request.name())
                && List.of("payment retry").equals(request.aliases())
        ));
        verifyNoMoreInteractions(dashwaySchemaService);
    }

    @Test
    void dispatchBatchIngestToDashwaySchemaService() {
        dispatcher.dispatch(
            GraphEventType.DASHWAY_BATCH_INGEST,
            Map.of(
                "concepts",
                List.of(Map.of("id", "concept-1", "name", "One Graph")),
                "people",
                List.of(Map.of("id", "person-jay", "name", "Jay"))
            )
        );

        verify(dashwaySchemaService).ingestBatch(Mockito.argThat(request ->
            request != null
                && request.concepts() != null
                && request.concepts().size() == 1
                && "concept-1".equals(request.concepts().get(0).id())
                && request.people() != null
                && request.people().size() == 1
                && "person-jay".equals(request.people().get(0).id())
        ));
        verifyNoMoreInteractions(dashwaySchemaService);
    }
}
